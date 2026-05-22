import { and, eq, sql } from "drizzle-orm";
import { getDb, groupAvecLoans, groupWalletLedgerEntries } from "@/db";
import { getMemberContributionStats } from "@/lib/group-savings-member-stats";
import { getGroupUsdtBalance } from "@/lib/group-savings-ledger";
import { numFromNumeric } from "@/lib/wallet-types";

export type FundBucket = "savings" | "social" | "admin";

export type GroupFundSummary = {
  totalUsdt: number;
  savingsUsdt: number;
  socialUsdt: number;
  adminUsdt: number;
  lentUsdt: number;
  availableUsdt: number;
  totalShares: number;
  shareValueUsdt: number;
};

/** Classify ledger line → fund bucket (meta.bucket overrides legacy rows). */
export function ledgerBucket(
  entryType: string,
  meta: Record<string, unknown> | null | undefined,
): FundBucket {
  const b = meta?.bucket;
  if (b === "savings" || b === "social" || b === "admin") return b;
  if (entryType === "group_social_contribution_in") return "social";
  if (entryType === "group_subscription_fee") return "admin";
  if (
    entryType === "group_contribution_in" ||
    entryType === "group_payout_out" ||
    entryType === "group_payout_in" ||
    entryType === "group_loan_disburse_out" ||
    entryType === "group_loan_repay_in"
  ) {
    return "savings";
  }
  return "savings";
}

export async function getGroupFundSummary(
  groupId: string,
  shareValueUsdt = 0,
): Promise<GroupFundSummary> {
  const db = getDb();
  const rows = await db
    .select({
      entryType: groupWalletLedgerEntries.entryType,
      amount: groupWalletLedgerEntries.amount,
      meta: groupWalletLedgerEntries.meta,
    })
    .from(groupWalletLedgerEntries)
    .where(eq(groupWalletLedgerEntries.groupId, groupId));

  let savingsUsdt = 0;
  let socialUsdt = 0;
  let adminUsdt = 0;

  for (const r of rows) {
    const n = numFromNumeric(r.amount?.toString());
    const bucket = ledgerBucket(r.entryType, r.meta as Record<string, unknown> | null);
    if (bucket === "social") socialUsdt += n;
    else if (bucket === "admin") adminUsdt += n;
    else savingsUsdt += n;
  }

  const stats = await getMemberContributionStats(groupId);
  const totalShares = stats.reduce((s, m) => s + m.sharesTotal, 0);
  const totalUsdt = await getGroupUsdtBalance(groupId);
  const lentUsdt = await getGroupLentUsdt(groupId);
  const availableUsdt = Math.max(0, savingsUsdt - lentUsdt);

  return {
    totalUsdt,
    savingsUsdt,
    socialUsdt,
    adminUsdt,
    lentUsdt,
    availableUsdt,
    totalShares,
    shareValueUsdt,
  };
}

export function fundBucketMeta(bucket: FundBucket): { bucket: FundBucket } {
  return { bucket };
}

/** Outstanding AVEC internal loans (savings fund locked). */
export async function getGroupLentUsdt(groupId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ s: sql<string>`coalesce(sum(${groupAvecLoans.outstandingUsdt}), 0)` })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, groupId),
        eq(groupAvecLoans.status, "disbursed"),
      ),
    );
  return numFromNumeric(rows[0]?.s?.toString() ?? "0");
}
