import { and, eq, sql } from "drizzle-orm";
import { getDb, groupWalletLedgerEntries } from "@/db";
import { numFromNumeric } from "@/lib/wallet-types";

export type MemberContributionStat = {
  userId: string;
  totalUsdt: number;
  meetingCount: number;
  sharesTotal: number;
};

/**
 * Aggregate member savings from group treasury ledger (contribution entries).
 */
export async function getMemberContributionStats(
  groupId: string,
): Promise<MemberContributionStat[]> {
  const db = getDb();
  const rows = await db
    .select({
      userId: sql<string>`(${groupWalletLedgerEntries.meta}->>'userId')`,
      total: sql<string>`coalesce(sum(${groupWalletLedgerEntries.amount}), 0)`,
      meetings: sql<number>`count(*)::int`,
      shares: sql<number>`coalesce(sum((${groupWalletLedgerEntries.meta}->>'shares')::int), 0)::int`,
    })
    .from(groupWalletLedgerEntries)
    .where(
      and(
        eq(groupWalletLedgerEntries.groupId, groupId),
        eq(groupWalletLedgerEntries.entryType, "group_contribution_in"),
      ),
    )
    .groupBy(sql`(${groupWalletLedgerEntries.meta}->>'userId')`);

  return rows
    .filter((r) => r.userId)
    .map((r) => ({
      userId: r.userId,
      totalUsdt: numFromNumeric(r.total?.toString()),
      meetingCount: Number(r.meetings) || 0,
      sharesTotal: Number(r.shares) || 0,
    }));
}
