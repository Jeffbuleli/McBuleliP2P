import { and, eq, gte, inArray } from "drizzle-orm";
import { getDb, groupWalletLedgerEntries } from "@/db";
import { DEFAULT_GOVERNANCE_RULES } from "@/lib/avec/governance/rules";
import { numFromNumeric } from "@/lib/wallet-types";

const TREASURY_OUTFLOW_TYPES = [
  "group_payout_out",
  "group_social_aid_out",
  "group_loan_disburse_out",
] as const;

/** Sum of payouts + solidarity aid sent from group treasury in the last 24 hours. */
export async function groupTreasuryOutflowLast24hUsdt(groupId: string): Promise<number> {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ amount: groupWalletLedgerEntries.amount })
    .from(groupWalletLedgerEntries)
    .where(
      and(
        eq(groupWalletLedgerEntries.groupId, groupId),
        gte(groupWalletLedgerEntries.createdAt, since),
        inArray(groupWalletLedgerEntries.entryType, [...TREASURY_OUTFLOW_TYPES]),
      ),
    );

  let total = 0;
  for (const r of rows) {
    const n = numFromNumeric(r.amount?.toString());
    if (n < 0) total += -n;
  }
  return total;
}

export async function assertWithinDailyTreasuryOutflowCap(args: {
  groupId: string;
  additionalUsdt: number;
}): Promise<
  | { ok: true }
  | { ok: false; message: string; usedUsdt: number; capUsdt: number }
> {
  const cap = DEFAULT_GOVERNANCE_RULES.maxGroupTreasuryOutflowPerDayUsdt;
  const used = await groupTreasuryOutflowLast24hUsdt(args.groupId);
  if (used + args.additionalUsdt > cap + 1e-9) {
    return { ok: false, message: "group_gov_daily_outflow_cap", usedUsdt: used, capUsdt: cap };
  }
  return { ok: true };
}
