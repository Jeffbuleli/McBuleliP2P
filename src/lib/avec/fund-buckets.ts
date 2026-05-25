import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, groupAvecLoans, groupWalletLedgerEntries } from "@/db";

const TRANSFER_FROM_BUCKETS: FundBucket[] = ["penalties", "interest"];
const TRANSFER_TO_BUCKETS: FundBucket[] = ["social", "reserve", "savings"];
import { getMemberContributionStats } from "@/lib/group-savings-member-stats";
import { getGroupUsdtBalance } from "@/lib/group-savings-ledger";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export type FundBucket =
  | "savings"
  | "social"
  | "admin"
  | "penalties"
  | "interest"
  | "reserve";

export type GroupFundSummary = {
  totalUsdt: number;
  savingsUsdt: number;
  socialUsdt: number;
  adminUsdt: number;
  penaltiesUsdt: number;
  interestUsdt: number;
  reserveUsdt: number;
  lentUsdt: number;
  /** Outstanding internal loans (encours) — same as lentUsdt, informational credit bucket. */
  creditUsdt: number;
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
  if (
    b === "savings" ||
    b === "social" ||
    b === "admin" ||
    b === "penalties" ||
    b === "interest" ||
    b === "reserve"
  ) {
    return b;
  }
  if (
    entryType === "group_social_contribution_in" ||
    entryType === "group_social_aid_out"
  ) {
    return "social";
  }
  if (entryType === "group_social_aid_in") return "savings";
  if (entryType === "group_subscription_fee") return "admin";
  if (entryType === "group_loan_repay_penalty_in") return "penalties";
  if (entryType === "group_loan_repay_interest_in") return "interest";
  if (entryType === "group_reserve_in") return "reserve";
  if (entryType === "group_bucket_transfer_out" || entryType === "group_bucket_transfer_in") {
    const b = meta?.bucket;
    if (
      b === "savings" ||
      b === "social" ||
      b === "admin" ||
      b === "penalties" ||
      b === "interest" ||
      b === "reserve"
    ) {
      return b;
    }
  }
  if (
    entryType === "group_contribution_in" ||
    entryType === "group_payout_out" ||
    entryType === "group_payout_in" ||
    entryType === "group_loan_disburse_out" ||
    entryType === "group_loan_repay_in" ||
    entryType === "group_loan_repay_principal_in" ||
    entryType === "group_cycle_distribution_out" ||
    entryType === "group_cycle_distribution_in"
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
  let penaltiesUsdt = 0;
  let interestUsdt = 0;
  let reserveUsdt = 0;

  for (const r of rows) {
    const n = numFromNumeric(r.amount?.toString());
    const bucket = ledgerBucket(r.entryType, r.meta as Record<string, unknown> | null);
    if (bucket === "social") socialUsdt += n;
    else if (bucket === "admin") adminUsdt += n;
    else if (bucket === "penalties") penaltiesUsdt += n;
    else if (bucket === "interest") interestUsdt += n;
    else if (bucket === "reserve") reserveUsdt += n;
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
    penaltiesUsdt,
    interestUsdt,
    reserveUsdt,
    lentUsdt,
    creditUsdt: lentUsdt,
    availableUsdt,
    totalShares,
    shareValueUsdt,
  };
}

export function fundBucketMeta(bucket: FundBucket): { bucket: FundBucket } {
  return { bucket };
}

function bucketBalance(summary: GroupFundSummary, bucket: FundBucket): number {
  if (bucket === "social") return summary.socialUsdt;
  if (bucket === "admin") return summary.adminUsdt;
  if (bucket === "penalties") return summary.penaltiesUsdt;
  if (bucket === "interest") return summary.interestUsdt;
  if (bucket === "reserve") return summary.reserveUsdt;
  return summary.savingsUsdt;
}

export async function validateBucketTransfer(args: {
  groupId: string;
  fromBucket: string;
  toBucket: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; fromBucket: FundBucket; toBucket: FundBucket; amountUsdt: number }
  | { ok: false; message: string }
> {
  const from = args.fromBucket as FundBucket;
  const to = args.toBucket as FundBucket;
  if (!TRANSFER_FROM_BUCKETS.includes(from)) {
    return { ok: false, message: "group_gov_invalid_bucket_from" };
  }
  if (!TRANSFER_TO_BUCKETS.includes(to)) {
    return { ok: false, message: "group_gov_invalid_bucket_to" };
  }
  if (from === to) return { ok: false, message: "group_gov_invalid_bucket_transfer" };
  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }
  const funds = await getGroupFundSummary(args.groupId);
  const available = bucketBalance(funds, from);
  if (args.amountUsdt > available + 1e-9) {
    return { ok: false, message: "group_gov_bucket_insufficient" };
  }
  return { ok: true, fromBucket: from, toBucket: to, amountUsdt: args.amountUsdt };
}

export async function executeBucketTransfer(args: {
  groupId: string;
  actorUserId: string;
  fromBucket: FundBucket;
  toBucket: FundBucket;
  amountUsdt: number;
  proposalId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const check = await validateBucketTransfer({
    groupId: args.groupId,
    fromBucket: args.fromBucket,
    toBucket: args.toBucket,
    amountUsdt: args.amountUsdt,
  });
  if (!check.ok) return check;

  const db = getDb();
  const batchId = randomUUID();
  const amt = fmtWalletAmount(check.amountUsdt);
  const baseMeta = { proposalId: args.proposalId, by: args.actorUserId };

  await db.insert(groupWalletLedgerEntries).values([
    {
      batchId,
      groupId: args.groupId,
      entryType: "group_bucket_transfer_out",
      asset: "USDT",
      amount: `-${amt}`,
      meta: {
        ...baseMeta,
        ...fundBucketMeta(check.fromBucket),
        counterBucket: check.toBucket,
      },
    },
    {
      batchId,
      groupId: args.groupId,
      entryType: "group_bucket_transfer_in",
      asset: "USDT",
      amount: amt,
      meta: {
        ...baseMeta,
        ...fundBucketMeta(check.toBucket),
        counterBucket: check.fromBucket,
      },
    },
  ]);

  return { ok: true };
}

/** Split loan repayment into bucket-specific group ledger lines. */
export function buildLoanRepayGroupLedgerLines(args: {
  batchId: string;
  groupId: string;
  loanId: string;
  borrowerUserId: string;
  by: string;
  toPrincipal: number;
  toInterest: number;
  toPenalty: number;
}): {
  entryType: string;
  amount: string;
  meta: Record<string, unknown>;
}[] {
  const base = {
    loanId: args.loanId,
    borrowerUserId: args.borrowerUserId,
    by: args.by,
  };
  const lines: { entryType: string; amount: string; meta: Record<string, unknown> }[] = [];
  if (args.toPenalty > 1e-12) {
    lines.push({
      entryType: "group_loan_repay_penalty_in",
      amount: fmtWalletAmount(args.toPenalty),
      meta: {
        ...base,
        penaltyUsdt: args.toPenalty,
        ...fundBucketMeta("penalties"),
      },
    });
  }
  if (args.toInterest > 1e-12) {
    lines.push({
      entryType: "group_loan_repay_interest_in",
      amount: fmtWalletAmount(args.toInterest),
      meta: {
        ...base,
        interestUsdt: args.toInterest,
        ...fundBucketMeta("interest"),
      },
    });
  }
  if (args.toPrincipal > 1e-12) {
    lines.push({
      entryType: "group_loan_repay_principal_in",
      amount: fmtWalletAmount(args.toPrincipal),
      meta: {
        ...base,
        principalUsdt: args.toPrincipal,
        ...fundBucketMeta("savings"),
      },
    });
  }
  return lines;
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
