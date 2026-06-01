import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  botSubscriptions,
  getDb,
  rewardPointGrants,
  rewardPointLedger,
  users,
} from "@/db";
import {
  REWARD_GRANT,
  REWARD_MONTHLY_EARN_CAP,
  REWARD_POINTS,
  type RewardGrantType,
} from "@/lib/reward-points-config";

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
 * Idempotent one-time grant. Returns points credited (0 if already granted or capped).
 */
export async function tryGrantRewardPoints(args: {
  userId: string;
  grantType: RewardGrantType;
  meta?: Record<string, unknown>;
}): Promise<{ granted: boolean; points: number; balance: number }> {
  const points = REWARD_POINTS[args.grantType];
  if (!Number.isFinite(points) || points <= 0) {
    const bal = await getRewardPointsBalance(args.userId);
    return { granted: false, points: 0, balance: bal };
  }

  const earnedThisMonth = await monthlyEarnedPoints(args.userId);
  if (earnedThisMonth + points > REWARD_MONTHLY_EARN_CAP) {
    const bal = await getRewardPointsBalance(args.userId);
    return { granted: false, points: 0, balance: bal };
  }

  const db = getDb();

  try {
    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(rewardPointGrants)
        .values({
          userId: args.userId,
          grantType: args.grantType,
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
  };

  const monthlyEarned = await monthlyEarnedPoints(userId);

  return {
    balance: userRow?.bal ?? 0,
    monthlyEarned,
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

/** Call when KYC becomes approved (Didit, restore, manual). */
export async function tryGrantKycApprovedPoints(
  userId: string,
): Promise<void> {
  await tryGrantRewardPoints({
    userId,
    grantType: REWARD_GRANT.KYC_APPROVED,
  });
}

/** Call after first bot subscription is created. */
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
    meta: { planId: args.planId, subscriptionId: args.subscriptionId },
  });
}

/** Call when email is verified. */
export async function tryGrantEmailVerifiedPoints(
  userId: string,
): Promise<void> {
  await tryGrantRewardPoints({
    userId,
    grantType: REWARD_GRANT.EMAIL_VERIFIED,
  });
}
