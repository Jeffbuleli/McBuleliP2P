import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb, withdrawals } from "@/db";
import { WithdrawalStatus } from "@/lib/status";
import type { WalletAsset } from "@/lib/wallet-types";

const ACTIVE_STATUSES = [
  WithdrawalStatus.PENDING_AGENT,
  WithdrawalStatus.PROCESSING,
  WithdrawalStatus.QUEUED,
  WithdrawalStatus.DELAYED_BATCH,
  WithdrawalStatus.COMPLETED,
] as const;

function dailyMax(asset: WalletAsset): number {
  if (asset === "USDT") {
    const v = Number(process.env.WITHDRAWAL_DAILY_MAX_USDT ?? "10000");
    return Number.isFinite(v) && v > 0 ? v : 10000;
  }
  if (asset === "PI") {
    const v = Number(process.env.WITHDRAWAL_DAILY_MAX_PI ?? "50000");
    return Number.isFinite(v) && v > 0 ? v : 50000;
  }
  return Infinity;
}

/** Blocks when rolling 24h outbound total + new amount exceeds env cap. */
export async function assertWithdrawalDailyLimit(args: {
  userId: string;
  asset: WalletAsset;
  amountNum: number;
}): Promise<{ ok: true } | { ok: false; code: string; limit: number; used: number }> {
  if (!Number.isFinite(args.amountNum) || args.amountNum <= 0) {
    return { ok: false, code: "withdraw_invalid_amount", limit: 0, used: 0 };
  }

  const cap = dailyMax(args.asset);
  if (!Number.isFinite(cap)) {
    return { ok: true };
  }

  const since = new Date(Date.now() - 24 * 60 * 60_000);
  const db = getDb();
  const [row] = await db
    .select({
      total: sql<string>`coalesce(sum(${withdrawals.amount}::numeric), 0)`,
    })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.userId, args.userId),
        eq(withdrawals.asset, args.asset),
        gte(withdrawals.createdAt, since),
        inArray(withdrawals.status, [...ACTIVE_STATUSES]),
      ),
    );

  const used = Number(row?.total ?? 0);
  if (!Number.isFinite(used)) {
    return { ok: true };
  }
  if (used + args.amountNum > cap + 1e-8) {
    return {
      ok: false,
      code: "withdraw_daily_limit_exceeded",
      limit: cap,
      used,
    };
  }
  return { ok: true };
}
