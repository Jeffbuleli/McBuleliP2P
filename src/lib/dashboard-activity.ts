import { desc, eq } from "drizzle-orm";
import { getDb, deposits, withdrawals } from "@/db";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import type { Locale } from "@/i18n/locale";
import { DepositStatus, WithdrawalStatus } from "@/lib/status";
import type { ActivityRow } from "@/components/mobile/recent-activity";

function depositTone(
  s: string,
): "success" | "pending" | "failed" {
  if (s === DepositStatus.CONFIRMED) return "success";
  if (s === DepositStatus.FAILED) return "failed";
  return "pending";
}

function withdrawalTone(
  s: string,
): "success" | "pending" | "failed" {
  if (s === WithdrawalStatus.COMPLETED) return "success";
  if (s === WithdrawalStatus.REJECTED || s === WithdrawalStatus.FAILED) {
    return "failed";
  }
  return "pending";
}

export async function loadRecentActivity(
  userId: string,
  locale: Locale,
  limit = 8,
): Promise<ActivityRow[]> {
  const db = getDb();

  const [depRows, wdRows] = await Promise.all([
    db
      .select({
        id: deposits.id,
        asset: deposits.asset,
        networkCanonical: deposits.networkCanonical,
        amount: deposits.amount,
        status: deposits.status,
        createdAt: deposits.createdAt,
      })
      .from(deposits)
      .where(eq(deposits.userId, userId))
      .orderBy(desc(deposits.createdAt))
      .limit(12),
    db
      .select({
        id: withdrawals.id,
        asset: withdrawals.asset,
        networkCanonical: withdrawals.networkCanonical,
        amount: withdrawals.amount,
        status: withdrawals.status,
        createdAt: withdrawals.createdAt,
      })
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt))
      .limit(12),
  ]);

  const merged: (ActivityRow & { at: number })[] = [
    ...depRows.map((r) => ({
      id: r.id,
      kind: "deposit" as const,
      asset: r.asset,
      networkLabel: activityNetworkLabel(locale, r.networkCanonical),
      amount: r.amount?.toString() ?? null,
      status: r.status,
      tone: depositTone(r.status),
      at: r.createdAt.getTime(),
    })),
    ...wdRows.map((r) => ({
      id: r.id,
      kind: "withdrawal" as const,
      asset: r.asset,
      networkLabel: activityNetworkLabel(locale, r.networkCanonical),
      amount: r.amount?.toString() ?? null,
      status: r.status,
      tone: withdrawalTone(r.status),
      at: r.createdAt.getTime(),
    })),
  ];

  merged.sort((a, b) => b.at - a.at);

  return merged.slice(0, limit).map(({ at: _a, ...row }) => row);
}
