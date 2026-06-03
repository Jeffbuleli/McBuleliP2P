import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import {
  botSubscriptions,
  getDb,
  p2pOrders,
  rewardPointGrants,
  rewardPointLedger,
  rewardPointPerks,
  userStakes,
  users,
} from "@/db";
import {
  REWARD_GRANT,
  REWARD_MONTHLY_EARN_CAP,
  REWARD_POINTS,
  REWARD_SPEND,
  type RewardGrantType,
  type RewardSpendId,
} from "@/lib/reward-points-config";
import { listActiveRewardPerks } from "@/lib/reward-point-perks";

export type RewardPointsSummary = {
  balance: number;
  monthlyEarned: number;
  monthlyCap: number;
  grants: Record<RewardGrantType, boolean>;
};

export type RewardLedgerRow = {
  id: string;
  amount: number;
  grantType: string | null;
  note: string | null;
  createdAt: string;
};

function monthStartUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function resolvePoints(grantType: string, override?: number): number {
  if (override != null && Number.isFinite(override)) return override;
  if (grantType in REWARD_POINTS) {
    return REWARD_POINTS[grantType as RewardGrantType];
  }
  return 0;
}

async function monthlyEarnedPoints(userId: string): Promise<number> {
  const db = getDb();
  const since = monthStartUtc();
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${rewardPointLedger.amount}), 0)::int`,
    })
    .from(rewardPointLedger)
    .where(
      and(
        eq(rewardPointLedger.userId, userId),
        gte(rewardPointLedger.createdAt, since),
        sql`${rewardPointLedger.amount} > 0`,
      ),
    );
  return row?.total ?? 0;
}

async function readBalance(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  userId: string,
): Promise<number> {
  const [u] = await tx
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.bal ?? 0;
}

/**
 * Idempotent grant — unique on (userId, idempotencyKey).
 */
export async function tryGrantRewardPoints(args: {
  userId: string;
  grantType: string;
  idempotencyKey: string;
  points?: number;
  meta?: Record<string, unknown>;
  skipMonthlyCap?: boolean;
}): Promise<{ granted: boolean; points: number; balance: number }> {
  const points = resolvePoints(args.grantType, args.points);
  if (!Number.isFinite(points) || points <= 0) {
    const bal = await getRewardPointsBalance(args.userId);
    return { granted: false, points: 0, balance: bal };
  }

  if (!args.skipMonthlyCap) {
    const earnedThisMonth = await monthlyEarnedPoints(args.userId);
    if (earnedThisMonth + points > REWARD_MONTHLY_EARN_CAP) {
      const bal = await getRewardPointsBalance(args.userId);
      return { granted: false, points: 0, balance: bal };
    }
  }

  const db = getDb();

  try {
    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(rewardPointGrants)
        .values({
          userId: args.userId,
          grantType: args.grantType,
          idempotencyKey: args.idempotencyKey,
          points,
          meta: args.meta ?? null,
        })
        .onConflictDoNothing()
        .returning({ id: rewardPointGrants.id });

      if (!inserted) {
        return { granted: false, balance: await readBalance(tx, args.userId) };
      }

      const [updated] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} + ${points}`,
        })
        .where(eq(users.id, args.userId))
        .returning({ bal: users.buleliPointsBalance });

      await tx.insert(rewardPointLedger).values({
        userId: args.userId,
        amount: points,
        grantType: args.grantType,
        note: null,
        meta: args.meta ?? null,
      });

      return { granted: true, balance: updated?.bal ?? 0 };
    });

    return {
      granted: result.granted,
      points: result.granted ? points : 0,
      balance: result.balance,
    };
  } catch (err) {
    console.warn("[reward-points] grant failed", args.grantType, err);
    const bal = await getRewardPointsBalance(args.userId);
    return { granted: false, points: 0, balance: bal };
  }
}

export async function spendRewardPointsForPerk(args: {
  userId: string;
  spendId: RewardSpendId;
}): Promise<
  { ok: true; balance: number; perkType: string } | { ok: false; message: string }
> {
  const opt = REWARD_SPEND[args.spendId];
  const db = getDb();

  const [user] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  if (!user || user.bal < opt.costBp) {
    return { ok: false, message: "points_insufficient_balance" };
  }

  const now = new Date();
  const [existing] = await db
    .select({ id: rewardPointPerks.id })
    .from(rewardPointPerks)
    .where(
      and(
        eq(rewardPointPerks.userId, args.userId),
        eq(rewardPointPerks.perkType, opt.perkType),
        eq(rewardPointPerks.status, "active"),
        gte(rewardPointPerks.expiresAt, now),
      ),
    )
    .limit(1);

  if (existing) {
    return { ok: false, message: "points_perk_already_active" };
  }

  const expiresAt = new Date(now.getTime() + opt.validDays * 86_400_000);

  try {
    const balance = await db.transaction(async (tx) => {
      const [deducted] = await tx
        .update(users)
        .set({
          buleliPointsBalance: sql`${users.buleliPointsBalance} - ${opt.costBp}`,
        })
        .where(
          and(
            eq(users.id, args.userId),
            sql`${users.buleliPointsBalance} >= ${opt.costBp}`,
          ),
        )
        .returning({ bal: users.buleliPointsBalance });

      if (!deducted) {
        throw new Error("points_insufficient_balance");
      }

      await tx.insert(rewardPointPerks).values({
        userId: args.userId,
        perkType: opt.perkType,
        discountPercent: opt.discountPercent,
        status: "active",
        expiresAt,
      });

      await tx.insert(rewardPointLedger).values({
        userId: args.userId,
        amount: -opt.costBp,
        grantType: null,
        note: `spend:${opt.perkType}`,
        meta: { spendId: args.spendId },
      });

      return deducted.bal;
    });

    return { ok: true, balance, perkType: opt.perkType };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "points_spend_failed";
    return { ok: false, message: msg };
  }
}

export async function getRewardPointsBalance(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.bal ?? 0;
}

export async function getRewardPointsSummary(
  userId: string,
): Promise<RewardPointsSummary> {
  const db = getDb();
  const [userRow] = await db
    .select({ bal: users.buleliPointsBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const grantRows = await db
    .select({ grantType: rewardPointGrants.grantType })
    .from(rewardPointGrants)
    .where(eq(rewardPointGrants.userId, userId));

  const granted = new Set(grantRows.map((r) => r.grantType));
  const grants = {
    [REWARD_GRANT.EMAIL_VERIFIED]: granted.has(REWARD_GRANT.EMAIL_VERIFIED),
    [REWARD_GRANT.KYC_APPROVED]: granted.has(REWARD_GRANT.KYC_APPROVED),
    [REWARD_GRANT.BOT_FIRST_SUBSCRIPTION]: granted.has(
      REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
    ),
    [REWARD_GRANT.STAKING_OPENED]: grantRows.some(
      (r) => r.grantType === REWARD_GRANT.STAKING_OPENED,
    ),
    [REWARD_GRANT.STAKING_MATURED]: grantRows.some(
      (r) => r.grantType === REWARD_GRANT.STAKING_MATURED,
    ),
    [REWARD_GRANT.P2P_TRADE_COMPLETED]: grantRows.some(
      (r) => r.grantType === REWARD_GRANT.P2P_TRADE_COMPLETED,
    ),
    [REWARD_GRANT.TRAINING_ENROLLED]: granted.has(REWARD_GRANT.TRAINING_ENROLLED),
    [REWARD_GRANT.TRAINING_SESSION_ATTENDED]: grantRows.some(
      (r) => r.grantType === REWARD_GRANT.TRAINING_SESSION_ATTENDED,
    ),
    [REWARD_GRANT.TRAINING_QUIZ_PASSED]: granted.has(REWARD_GRANT.TRAINING_QUIZ_PASSED),
  };

  return {
    balance: userRow?.bal ?? 0,
    monthlyEarned: await monthlyEarnedPoints(userId),
    monthlyCap: REWARD_MONTHLY_EARN_CAP,
    grants,
  };
}

export async function listRewardPointLedger(
  userId: string,
  limit = 30,
): Promise<RewardLedgerRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(rewardPointLedger)
    .where(eq(rewardPointLedger.userId, userId))
    .orderBy(desc(rewardPointLedger.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    grantType: r.grantType,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function tryGrantKycApprovedPoints(userId: string): Promise<void> {
  await tryGrantRewardPoints({
    userId,
    grantType: REWARD_GRANT.KYC_APPROVED,
    idempotencyKey: REWARD_GRANT.KYC_APPROVED,
  });
}

export async function tryGrantBotFirstSubscriptionPoints(args: {
  userId: string;
  planId: string;
  subscriptionId: string;
}): Promise<void> {
  const db = getDb();
  const [prior] = await db
    .select({ id: botSubscriptions.id })
    .from(botSubscriptions)
    .where(
      and(
        eq(botSubscriptions.userId, args.userId),
        sql`${botSubscriptions.id} <> ${args.subscriptionId}::uuid`,
      ),
    )
    .limit(1);

  if (prior) return;

  await tryGrantRewardPoints({
    userId: args.userId,
    grantType: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
    idempotencyKey: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
    meta: { planId: args.planId, subscriptionId: args.subscriptionId },
  });
}

export async function tryGrantEmailVerifiedPoints(userId: string): Promise<void> {
  await tryGrantRewardPoints({
    userId,
    grantType: REWARD_GRANT.EMAIL_VERIFIED,
    idempotencyKey: REWARD_GRANT.EMAIL_VERIFIED,
  });
}

export async function tryGrantStakingOpenedPoints(args: {
  userId: string;
  stakeId: string;
}): Promise<void> {
  await tryGrantRewardPoints({
    userId: args.userId,
    grantType: REWARD_GRANT.STAKING_OPENED,
    idempotencyKey: `staking_opened:${args.stakeId}`,
    meta: { stakeId: args.stakeId },
  });
}

export async function tryGrantStakingMaturedPoints(args: {
  userId: string;
  stakeId: string;
}): Promise<void> {
  await tryGrantRewardPoints({
    userId: args.userId,
    grantType: REWARD_GRANT.STAKING_MATURED,
    idempotencyKey: `staking_matured:${args.stakeId}`,
    meta: { stakeId: args.stakeId },
  });
}

export async function tryGrantP2pTradeCompletedPoints(args: {
  userId: string;
  orderId: string;
}): Promise<void> {
  await tryGrantRewardPoints({
    userId: args.userId,
    grantType: REWARD_GRANT.P2P_TRADE_COMPLETED,
    idempotencyKey: `p2p_trade:${args.orderId}`,
    meta: { orderId: args.orderId },
  });
}

export type ReconcileRewardPointsResult = {
  credited: Array<{ grantType: string; points: number }>;
};

export async function reconcileUserRewardPoints(
  userId: string,
): Promise<ReconcileRewardPointsResult> {
  const credited: ReconcileRewardPointsResult["credited"] = [];
  const db = getDb();

  const [user] = await db
    .select({
      emailVerifiedAt: users.emailVerifiedAt,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { credited };

  const reconcileMeta = { source: "reconcile" as const };

  if (user.emailVerifiedAt) {
    const r = await tryGrantRewardPoints({
      userId,
      grantType: REWARD_GRANT.EMAIL_VERIFIED,
      idempotencyKey: REWARD_GRANT.EMAIL_VERIFIED,
      meta: reconcileMeta,
      skipMonthlyCap: true,
    });
    if (r.granted) {
      credited.push({ grantType: REWARD_GRANT.EMAIL_VERIFIED, points: r.points });
    }
  }

  if (user.kycStatus === "approved") {
    const r = await tryGrantRewardPoints({
      userId,
      grantType: REWARD_GRANT.KYC_APPROVED,
      idempotencyKey: REWARD_GRANT.KYC_APPROVED,
      meta: reconcileMeta,
      skipMonthlyCap: true,
    });
    if (r.granted) {
      credited.push({ grantType: REWARD_GRANT.KYC_APPROVED, points: r.points });
    }
  }

  const [firstBot] = await db
    .select({ id: botSubscriptions.id, planId: botSubscriptions.planId })
    .from(botSubscriptions)
    .where(eq(botSubscriptions.userId, userId))
    .orderBy(asc(botSubscriptions.createdAt))
    .limit(1);

  if (firstBot) {
    const r = await tryGrantRewardPoints({
      userId,
      grantType: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
      idempotencyKey: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
      meta: {
        ...reconcileMeta,
        planId: firstBot.planId,
        subscriptionId: firstBot.id,
      },
      skipMonthlyCap: true,
    });
    if (r.granted) {
      credited.push({
        grantType: REWARD_GRANT.BOT_FIRST_SUBSCRIPTION,
        points: r.points,
      });
    }
  }

  const stakes = await db
    .select({ id: userStakes.id, status: userStakes.status })
    .from(userStakes)
    .where(eq(userStakes.userId, userId));

  for (const s of stakes) {
    const rOpen = await tryGrantRewardPoints({
      userId,
      grantType: REWARD_GRANT.STAKING_OPENED,
      idempotencyKey: `staking_opened:${s.id}`,
      meta: { ...reconcileMeta, stakeId: s.id },
      skipMonthlyCap: true,
    });
    if (rOpen.granted) {
      credited.push({
        grantType: REWARD_GRANT.STAKING_OPENED,
        points: rOpen.points,
      });
    }
    if (s.status === "completed") {
      const rMat = await tryGrantRewardPoints({
        userId,
        grantType: REWARD_GRANT.STAKING_MATURED,
        idempotencyKey: `staking_matured:${s.id}`,
        meta: { ...reconcileMeta, stakeId: s.id },
        skipMonthlyCap: true,
      });
      if (rMat.granted) {
        credited.push({
          grantType: REWARD_GRANT.STAKING_MATURED,
          points: rMat.points,
        });
      }
    }
  }

  const releasedOrders = await db
    .select({ id: p2pOrders.id })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.buyerUserId, userId),
        eq(p2pOrders.status, "released"),
      ),
    );

  for (const o of releasedOrders) {
    const r = await tryGrantRewardPoints({
      userId,
      grantType: REWARD_GRANT.P2P_TRADE_COMPLETED,
      idempotencyKey: `p2p_trade:${o.id}`,
      meta: { ...reconcileMeta, orderId: o.id },
      skipMonthlyCap: true,
    });
    if (r.granted) {
      credited.push({
        grantType: REWARD_GRANT.P2P_TRADE_COMPLETED,
        points: r.points,
      });
    }
  }

  return { credited };
}

export type BackfillRewardPointsResult = {
  usersProcessed: number;
  grantsCreated: number;
  pointsCredited: number;
};

export async function backfillAllUserRewardPoints(args?: {
  batchSize?: number;
}): Promise<BackfillRewardPointsResult> {
  const batchSize = args?.batchSize ?? 100;
  const db = getDb();
  let offset = 0;
  let usersProcessed = 0;
  let grantsCreated = 0;
  let pointsCredited = 0;

  for (;;) {
    const batch = await db
      .select({ id: users.id })
      .from(users)
      .orderBy(users.createdAt)
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    for (const row of batch) {
      const { credited } = await reconcileUserRewardPoints(row.id);
      usersProcessed += 1;
      grantsCreated += credited.length;
      pointsCredited += credited.reduce((s, c) => s + c.points, 0);
    }

    offset += batch.length;
    if (batch.length < batchSize) break;
  }

  return { usersProcessed, grantsCreated, pointsCredited };
}

export { listActiveRewardPerks };
