import { and, eq, gt, gte, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  lpPoolDailyDistributions,
  lpPoolPositions,
  lpPoolPositionRewardBalances,
  lpPoolRewardBalances,
  lpPoolRewardEntries,
  tradeFuturesPositions,
  tradeSimpleOptions,
  users,
} from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import {
  isAllowedLpLockMonths,
  lockMultiplier,
  lockTier,
  LP_POOL_DISTRIBUTION_RATE,
  lpPoolMinDepositUsdt,
  sizeMultiplier,
  sizeTier,
} from "@/lib/lp-pool-config";
import {
  nextBiweeklyPayoutAfterAnchor,
  poolDayWindowEndingAtLatestCutoff,
} from "@/lib/lp-pool-time";

const POS_ACTIVE = "active";

export function computeLpPoolShares(amountUsdt: number, lockMonths: number): {
  ok: true;
  shares: number;
  sizeTier: string;
  lockTier: string;
  sizeMultiplier: number;
  lockMultiplier: number;
} | { ok: false } {
  if (!Number.isFinite(amountUsdt) || amountUsdt <= 0) return { ok: false };
  if (!isAllowedLpLockMonths(lockMonths)) return { ok: false };
  const sTier = sizeTier(amountUsdt);
  const lTier = lockTier(lockMonths);
  const sMul = sizeMultiplier(sTier);
  const lMul = lockMultiplier(lockMonths);
  return {
    ok: true,
    shares: amountUsdt * sMul * lMul,
    sizeTier: sTier,
    lockTier: lTier,
    sizeMultiplier: sMul,
    lockMultiplier: lMul,
  };
}

export type CreateLpPoolPositionArgs = {
  userId: string;
  amountUsdtStr: string;
  lockMonths: number;
};

export async function createLpPoolPosition(
  args: CreateLpPoolPositionArgs,
): Promise<{ ok: true; positionId: string } | { ok: false; message: string }> {
  const amount = Number(args.amountUsdtStr);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: "lp_pool_invalid_amount" };
  }
  if (amount + 1e-12 < lpPoolMinDepositUsdt()) {
    return { ok: false, message: "lp_pool_below_minimum" };
  }
  if (!isAllowedLpLockMonths(args.lockMonths)) {
    return { ok: false, message: "lp_pool_invalid_lock" };
  }

  const amtStr = fmtWalletAmount(amount);
  const startedAt = new Date();
  const endsAt = new Date(
    Date.UTC(
      startedAt.getUTCFullYear(),
      startedAt.getUTCMonth() + args.lockMonths,
      startedAt.getUTCDate(),
      startedAt.getUTCHours(),
      startedAt.getUTCMinutes(),
      startedAt.getUTCSeconds(),
      startedAt.getUTCMilliseconds(),
    ),
  );

  const sTier = sizeTier(amount);
  const lTier = lockTier(args.lockMonths);
  const sMul = sizeMultiplier(sTier);
  const lMul = lockMultiplier(args.lockMonths);
  const shares = amount * sMul * lMul;
  const sharesStr = fmtWalletAmount(shares);

  const db = getDb();
  try {
    const positionId = await db.transaction(async (tx) => {
      const [u] = await tx
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, args.userId))
        .limit(1);
      if (!u) throw new Error("wallet_not_found");
      const bal = numFromNumeric(u.balance);
      if (bal + 1e-18 < amount) throw new Error("wallet_insufficient_balance");

      await debitUserAsset(tx, args.userId, "USDT", amtStr);

      const payoutAnchorAt = startedAt;
      const nextPayoutAt = nextBiweeklyPayoutAfterAnchor(payoutAnchorAt, payoutAnchorAt);

      const [row] = await tx
        .insert(lpPoolPositions)
        .values({
          userId: args.userId,
          asset: "USDT",
          amount: amtStr,
          lockMonths: args.lockMonths,
          sizeTier: sTier,
          lockTier: lTier,
          sizeMultiplier: sMul.toFixed(6),
          lockMultiplier: lMul.toFixed(6),
          shares: sharesStr,
          startedAt,
          payoutAnchorAt,
          nextPayoutAt,
          endsAt,
          status: POS_ACTIVE,
        })
        .returning({ id: lpPoolPositions.id });
      const id = row?.id;
      if (!id) throw new Error("lp_pool_create_failed");

      await tx
        .insert(lpPoolRewardBalances)
        .values({ userId: args.userId })
        .onConflictDoNothing();

      await tx
        .insert(lpPoolPositionRewardBalances)
        .values({ positionId: id })
        .onConflictDoNothing();

      const batchId = randomUUID();
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "lp_pool_lock",
          asset: "USDT",
          amount: `-${amtStr}`,
          feeUsdEquivalent: "0",
          meta: {
            positionId: id,
            lockMonths: args.lockMonths,
            sizeTier: sTier,
            lockTier: lTier,
            sizeMultiplier: sMul,
            lockMultiplier: lMul,
            shares,
            endsAt: endsAt.toISOString(),
          },
        },
      ]);

      return id;
    });
    return { ok: true, positionId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "lp_pool_create_failed";
    if (msg === "wallet_not_found") return { ok: false, message: msg };
    if (msg === "wallet_insufficient_balance") return { ok: false, message: msg };
    return { ok: false, message: "lp_pool_create_failed" };
  }
}

export async function listLpPoolPositions(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: lpPoolPositions.id,
      amount: lpPoolPositions.amount,
      lockMonths: lpPoolPositions.lockMonths,
      sizeTier: lpPoolPositions.sizeTier,
      lockTier: lpPoolPositions.lockTier,
      shares: lpPoolPositions.shares,
      startedAt: lpPoolPositions.startedAt,
      endsAt: lpPoolPositions.endsAt,
      status: lpPoolPositions.status,
      nextPayoutAt: lpPoolPositions.nextPayoutAt,
      rewardsAvailableUsdt: lpPoolPositionRewardBalances.availableUsdt,
      rewardsEarnedUsdt: lpPoolPositionRewardBalances.totalEarnedUsdt,
    })
    .from(lpPoolPositions)
    .leftJoin(
      lpPoolPositionRewardBalances,
      eq(lpPoolPositions.id, lpPoolPositionRewardBalances.positionId),
    )
    .where(eq(lpPoolPositions.userId, userId))
    .orderBy(sql`${lpPoolPositions.createdAt} DESC`);

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    lockMonths: r.lockMonths,
    sizeTier: r.sizeTier,
    lockTier: r.lockTier,
    shares: r.shares.toString(),
    startedAt: r.startedAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    status: r.status,
    rewardsAvailableUsdt: (r.rewardsAvailableUsdt ?? "0").toString(),
    rewardsEarnedUsdt: (r.rewardsEarnedUsdt ?? "0").toString(),
    nextPayoutAt: r.nextPayoutAt?.toISOString() ?? null,
  }));
}

export async function getLpPoolRewardBalance(userId: string): Promise<{
  availableUsdt: number;
  totalEarnedUsdt: number;
}> {
  const db = getDb();
  const [row] = await db
    .select({
      availableUsdt: lpPoolRewardBalances.availableUsdt,
      totalEarnedUsdt: lpPoolRewardBalances.totalEarnedUsdt,
    })
    .from(lpPoolRewardBalances)
    .where(eq(lpPoolRewardBalances.userId, userId))
    .limit(1);
  return {
    availableUsdt: numFromNumeric(row?.availableUsdt ?? "0"),
    totalEarnedUsdt: numFromNumeric(row?.totalEarnedUsdt ?? "0"),
  };
}

export async function getLpPoolAccruedForLatest24hWindow(args: {
  userId: string;
  now?: Date;
}): Promise<{ dayStartAt: string; dayEndAt: string; accruedUsdt: number }> {
  const now = args.now ?? new Date();
  const { dayStartAt, dayEndAt } = poolDayWindowEndingAtLatestCutoff(now);
  const db = getDb();

  const [row] = await db
    .select({ s: sql<string>`coalesce(sum(${lpPoolRewardEntries.amountUsdt}), 0)::text` })
    .from(lpPoolRewardEntries)
    .where(
      and(
        eq(lpPoolRewardEntries.userId, args.userId),
        eq(lpPoolRewardEntries.kind, "accrual"),
        eq(lpPoolRewardEntries.dayStartAt, dayStartAt),
      ),
    );

  const accrued = Number(row?.s ?? "0");
  return {
    dayStartAt: dayStartAt.toISOString(),
    dayEndAt: dayEndAt.toISOString(),
    accruedUsdt: Number.isFinite(accrued) ? accrued : 0,
  };
}

async function computeRevenueNetUsdt(args: { dayStartAt: Date; dayEndAt: Date }) {
  const db = getDb();

  const [fOpen] = await db
    .select({ s: sql<string>`coalesce(sum(${tradeFuturesPositions.feeOpenUsdt}), 0)::text` })
    .from(tradeFuturesPositions)
    .where(
      and(
        gte(tradeFuturesPositions.openedAt, args.dayStartAt),
        lt(tradeFuturesPositions.openedAt, args.dayEndAt),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    );

  const [fClose] = await db
    .select({
      s: sql<string>`coalesce(sum(${tradeFuturesPositions.feeCloseUsdt}), 0)::text`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        sql`${tradeFuturesPositions.closedAt} IS NOT NULL`,
        gte(tradeFuturesPositions.closedAt, args.dayStartAt),
        lt(tradeFuturesPositions.closedAt, args.dayEndAt),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    );

  const [opt] = await db
    .select({ s: sql<string>`coalesce(sum(${tradeSimpleOptions.feeUsdt}), 0)::text` })
    .from(tradeSimpleOptions)
    .where(
      and(
        gte(tradeSimpleOptions.createdAt, args.dayStartAt),
        lt(tradeSimpleOptions.createdAt, args.dayEndAt),
        eq(tradeSimpleOptions.isDemo, false),
      ),
    );

  const openFee = Number(fOpen?.s ?? "0");
  const closeFee = Number(fClose?.s ?? "0");
  const optFee = Number(opt?.s ?? "0");
  const total = openFee + closeFee + optFee;
  return Number.isFinite(total) ? total : 0;
}

export async function runLpPoolDailyDistribution(args?: { now?: Date }): Promise<{
  ok: true;
  dayStartAt: string;
  dayEndAt: string;
  revenueNetUsdt: number;
  rewardPoolUsdt: number;
  totalShares: number;
  skipped?: boolean;
}> {
  const now = args?.now ?? new Date();
  const { dayStartAt, dayEndAt } = poolDayWindowEndingAtLatestCutoff(now);
  const distributionRate = LP_POOL_DISTRIBUTION_RATE;

  const db = getDb();
  const revenueNet = await computeRevenueNetUsdt({ dayStartAt, dayEndAt });
  const rewardPool = revenueNet * distributionRate;

  // Compute totalShares for positions active during this window.
  const positions = await db
    .select({
      id: lpPoolPositions.id,
      userId: lpPoolPositions.userId,
      shares: lpPoolPositions.shares,
    })
    .from(lpPoolPositions)
    .where(
      and(
        eq(lpPoolPositions.status, POS_ACTIVE),
        lt(lpPoolPositions.startedAt, dayEndAt),
        gt(lpPoolPositions.endsAt, dayStartAt),
      ),
    );

  const totalShares = positions.reduce(
    (acc, p) => acc + numFromNumeric(p.shares),
    0,
  );

  // Insert daily distribution row (idempotent by dayStartAt unique).
  const [dist] = await db
    .insert(lpPoolDailyDistributions)
    .values({
      dayStartAt,
      dayEndAt,
      distributionRate: distributionRate.toFixed(6),
      revenueNetUsdt: fmtWalletAmount(revenueNet),
      rewardPoolUsdt: fmtWalletAmount(rewardPool),
      totalShares: fmtWalletAmount(totalShares),
    })
    .onConflictDoNothing()
    .returning({ id: lpPoolDailyDistributions.id });

  if (!dist) {
    return {
      ok: true,
      skipped: true,
      dayStartAt: dayStartAt.toISOString(),
      dayEndAt: dayEndAt.toISOString(),
      revenueNetUsdt: revenueNet,
      rewardPoolUsdt: rewardPool,
      totalShares,
    };
  }

  if (rewardPool <= 0 || totalShares <= 0 || positions.length === 0) {
    return {
      ok: true,
      dayStartAt: dayStartAt.toISOString(),
      dayEndAt: dayEndAt.toISOString(),
      revenueNetUsdt: revenueNet,
      rewardPoolUsdt: rewardPool,
      totalShares,
    };
  }

  // Credit accrual entries and update balances.
  const perUserAccrual = new Map<string, number>();
  const perPositionAccrual = new Map<string, number>();
  const accrualRows = positions.map((p) => {
    const sh = numFromNumeric(p.shares);
    const reward = (rewardPool * sh) / totalShares;
    if (reward > 0) {
      perUserAccrual.set(p.userId, (perUserAccrual.get(p.userId) ?? 0) + reward);
      perPositionAccrual.set(p.id, (perPositionAccrual.get(p.id) ?? 0) + reward);
    }
    return {
      userId: p.userId,
      positionId: p.id,
      kind: "accrual",
      dayStartAt,
      amountUsdt: fmtWalletAmount(reward),
      meta: { totalShares, rewardPool, shares: sh },
    };
  });

  await db.transaction(async (tx) => {
    await tx.insert(lpPoolRewardEntries).values(accrualRows).onConflictDoNothing();

    for (const [userId, sum] of perUserAccrual.entries()) {
      const sumStr = fmtWalletAmount(sum);
      await tx
        .insert(lpPoolRewardBalances)
        .values({ userId })
        .onConflictDoNothing();
      await tx
        .update(lpPoolRewardBalances)
        .set({
          availableUsdt: sql`${lpPoolRewardBalances.availableUsdt} + ${sumStr}::numeric`,
          totalEarnedUsdt: sql`${lpPoolRewardBalances.totalEarnedUsdt} + ${sumStr}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(lpPoolRewardBalances.userId, userId));
    }

    for (const [positionId, sum] of perPositionAccrual.entries()) {
      const sumStr = fmtWalletAmount(sum);
      await tx
        .insert(lpPoolPositionRewardBalances)
        .values({ positionId })
        .onConflictDoNothing();
      await tx
        .update(lpPoolPositionRewardBalances)
        .set({
          availableUsdt: sql`${lpPoolPositionRewardBalances.availableUsdt} + ${sumStr}::numeric`,
          totalEarnedUsdt: sql`${lpPoolPositionRewardBalances.totalEarnedUsdt} + ${sumStr}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(lpPoolPositionRewardBalances.positionId, positionId));
    }
  });

  return {
    ok: true,
    dayStartAt: dayStartAt.toISOString(),
    dayEndAt: dayEndAt.toISOString(),
    revenueNetUsdt: revenueNet,
    rewardPoolUsdt: rewardPool,
    totalShares,
  };
}

export async function withdrawLpPoolRewardsForPosition(args: {
  userId: string;
  positionId: string;
}): Promise<{ ok: true; withdrawnUsdt: number } | { ok: false; message: string }> {
  const db = getDb();
  const now = new Date();
  if (now.getUTCHours() < 1) {
    return { ok: false, message: "lp_pool_withdraw_before_cutoff" };
  }

  try {
    const out = await db.transaction(async (tx) => {
      const [pos] = await tx
        .select({
          userId: lpPoolPositions.userId,
          payoutAnchorAt: lpPoolPositions.payoutAnchorAt,
          nextPayoutAt: lpPoolPositions.nextPayoutAt,
        })
        .from(lpPoolPositions)
        .where(eq(lpPoolPositions.id, args.positionId))
        .limit(1);
      if (!pos || pos.userId !== args.userId) {
        return { ok: false as const, message: "lp_pool_position_not_found" };
      }

      const anchor = pos.payoutAnchorAt ?? new Date();
      const next = pos.nextPayoutAt ?? nextBiweeklyPayoutAfterAnchor(anchor, anchor);
      if (now.getTime() + 1000 < next.getTime()) {
        return { ok: false as const, message: "lp_pool_withdraw_not_in_window" };
      }

      const [bal] = await tx
        .select({ available: lpPoolPositionRewardBalances.availableUsdt })
        .from(lpPoolPositionRewardBalances)
        .where(eq(lpPoolPositionRewardBalances.positionId, args.positionId))
        .limit(1);
      const available = numFromNumeric(bal?.available ?? "0");
      if (available <= 0) {
        return { ok: false as const, message: "lp_pool_no_rewards" };
      }

      const amtStr = fmtWalletAmount(available);

      await tx
        .update(lpPoolPositionRewardBalances)
        .set({ availableUsdt: "0", updatedAt: now })
        .where(eq(lpPoolPositionRewardBalances.positionId, args.positionId));

      await tx
        .update(lpPoolRewardBalances)
        .set({
          availableUsdt: sql`${lpPoolRewardBalances.availableUsdt} - ${amtStr}::numeric`,
          updatedAt: now,
        })
        .where(eq(lpPoolRewardBalances.userId, args.userId));

      await tx
        .update(lpPoolPositions)
        .set({
          lastPayoutAt: now,
          nextPayoutAt: new Date(next.getTime() + 14 * 86_400_000),
        })
        .where(eq(lpPoolPositions.id, args.positionId));

      await tx.insert(lpPoolRewardEntries).values({
        userId: args.userId,
        positionId: args.positionId,
        kind: "payout",
        dayStartAt: null,
        amountUsdt: `-${amtStr}`,
        meta: { window: "biweekly" },
      });

      await creditUserAsset(tx, args.userId, "USDT", amtStr);

      const batchId = randomUUID();
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "lp_pool_reward_payout",
          asset: "USDT",
          amount: amtStr,
          feeUsdEquivalent: "0",
          meta: { amountUsdt: available, positionId: args.positionId },
        },
      ]);

      return { ok: true as const, withdrawnUsdt: available };
    });
    return out;
  } catch {
    return { ok: false, message: "lp_pool_withdraw_failed" };
  }
}

