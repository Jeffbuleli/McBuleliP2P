import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import {
  getDb,
  groupSavingsGroups,
  groupWalletLedgerEntries,
  users,
  walletLedgerEntries,
  withdrawals,
} from "@/db";
import { assetAmountToUsd } from "@/lib/wallet-convert";
import type { ReferenceRates } from "@/lib/reference-rates";
import { fetchReferenceRates } from "@/lib/reference-rates";
import { WithdrawalStatus } from "@/lib/status";
import { isWalletAsset, numFromNumeric, type WalletAsset } from "@/lib/wallet-types";

/** High-level cash-flow buckets (user `wallet_ledger_entries`). */
export const CASH_FLOW_BUCKETS = [
  "fiat_psp",
  "p2p",
  "platform_fees",
  "internal_transfer",
  "staking_pool_loan_trade",
  "group_user_wallet",
  "other",
] as const;

export type CashFlowBucket = (typeof CASH_FLOW_BUCKETS)[number];

/** Group treasury ledger (`group_wallet_ledger_entries`) - separate from user wallet. */
export const GROUP_TREASURY_BUCKETS = [
  "contribution_in",
  "payout_out",
  "subscription_fee",
  "other",
] as const;

export type GroupTreasuryBucket = (typeof GROUP_TREASURY_BUCKETS)[number];

export function classifyLedgerEntryType(entryType: string): CashFlowBucket {
  if (
    entryType === "fiat_deposit" ||
    entryType === "fiat_withdraw" ||
    entryType === "fiat_withdraw_refund"
  ) {
    return "fiat_psp";
  }
  if (entryType === "transfer_in" || entryType === "transfer_out") {
    return "internal_transfer";
  }
  if (entryType === "p2p_platform_fee") {
    return "platform_fees";
  }
  if (entryType.startsWith("p2p_") && entryType !== "p2p_platform_fee") {
    return "p2p";
  }
  if (
    entryType.startsWith("stake_") ||
    entryType.startsWith("lp_pool_") ||
    entryType.startsWith("loan_") ||
    entryType.startsWith("trade_futures_") ||
    entryType.startsWith("trade_options_")
  ) {
    return "staking_pool_loan_trade";
  }
  if (
    entryType.startsWith("group_contribution_") ||
    entryType === "group_payout_in" ||
    entryType === "group_subscription_fee"
  ) {
    return "group_user_wallet";
  }
  return "other";
}

export function classifyGroupLedgerEntryType(entryType: string): GroupTreasuryBucket {
  if (entryType === "group_contribution_in") return "contribution_in";
  if (entryType === "group_payout_out") return "payout_out";
  if (entryType === "group_subscription_fee") return "subscription_fee";
  return "other";
}

function emptyBuckets(): Record<CashFlowBucket, { usdSigned: number; lineCount: number }> {
  return {
    fiat_psp: { usdSigned: 0, lineCount: 0 },
    p2p: { usdSigned: 0, lineCount: 0 },
    platform_fees: { usdSigned: 0, lineCount: 0 },
    internal_transfer: { usdSigned: 0, lineCount: 0 },
    staking_pool_loan_trade: { usdSigned: 0, lineCount: 0 },
    group_user_wallet: { usdSigned: 0, lineCount: 0 },
    other: { usdSigned: 0, lineCount: 0 },
  };
}

function emptyGroupBuckets(): Record<
  GroupTreasuryBucket,
  { usdSigned: number; lineCount: number }
> {
  return {
    contribution_in: { usdSigned: 0, lineCount: 0 },
    payout_out: { usdSigned: 0, lineCount: 0 },
    subscription_fee: { usdSigned: 0, lineCount: 0 },
    other: { usdSigned: 0, lineCount: 0 },
  };
}

function signedUsdForLine(
  asset: string,
  amountSum: number,
  rates: ReferenceRates,
): number {
  const a: WalletAsset = isWalletAsset(asset) ? asset : "USDT";
  const mag = assetAmountToUsd(Math.abs(amountSum), a, rates);
  if (!Number.isFinite(mag)) return 0;
  return Math.sign(amountSum) * mag;
}

type UserBalanceSums = {
  usdt: string;
  pi: string;
  piTest: string;
  usd: string;
  cdf: string;
  referral: string;
};

function liabilityUsdFromSums(row: UserBalanceSums, rates: ReferenceRates): number {
  let total = 0;
  total += assetAmountToUsd(numFromNumeric(row.usdt), "USDT", rates);
  total += assetAmountToUsd(numFromNumeric(row.pi), "PI", rates);
  total += assetAmountToUsd(numFromNumeric(row.piTest), "PI_TEST", rates);
  total += assetAmountToUsd(numFromNumeric(row.usd), "USD", rates);
  total += assetAmountToUsd(numFromNumeric(row.cdf), "CDF", rates);
  total += assetAmountToUsd(numFromNumeric(row.referral), "USDT", rates);
  return total;
}

export type FinanceCashFlowDailyRow = {
  day: string;
  buckets: Record<CashFlowBucket, { usdSigned: number; lineCount: number }>;
  feesRecordedUsd: number;
};

export type GroupTreasuryDailyRow = {
  day: string;
  buckets: Record<GroupTreasuryBucket, { usdSigned: number; lineCount: number }>;
};

export type WithdrawalsPipelineSnapshot = {
  pendingAgentCount: number;
  processingCount: number;
  /** Sum(amount + fee) for USDT tickets still in PENDING_AGENT or PROCESSING. */
  openUsdtGross: number;
};

export type FinanceCashFlowReport = {
  daysRequested: number;
  sinceIso: string;
  untilIso: string;
  liabilityUsdEstimate: number;
  /** USDT held across all group treasuries (sum of group ledger amounts). */
  groupTreasuryLiabilityUsdt: number;
  ratesNote: string;
  daily: FinanceCashFlowDailyRow[];
  periodTotals: Record<CashFlowBucket, { usdSigned: number; lineCount: number }>;
  periodFeesRecordedUsd: number;
  ledgerLinesInRange: number;
  groupTreasuryDaily: GroupTreasuryDailyRow[];
  groupTreasuryPeriodTotals: Record<
    GroupTreasuryBucket,
    { usdSigned: number; lineCount: number }
  >;
  groupLedgerLinesInRange: number;
  withdrawalsPipeline: WithdrawalsPipelineSnapshot;
};

function parseDay(raw: unknown): string {
  if (typeof raw === "string") return raw.slice(0, 10);
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

export async function getCustodialLiabilityUsdEstimate(
  ratesArg?: ReferenceRates,
): Promise<number> {
  const rates = ratesArg ?? (await fetchReferenceRates());
  const db = getDb();
  const [row] = await db
    .select({
      usdt: sql<string>`coalesce(sum(${users.balance}::numeric),0)::text`,
      pi: sql<string>`coalesce(sum(${users.piBalance}::numeric),0)::text`,
      piTest: sql<string>`coalesce(sum(${users.piTestBalance}::numeric),0)::text`,
      usd: sql<string>`coalesce(sum(${users.usdBalance}::numeric),0)::text`,
      cdf: sql<string>`coalesce(sum(${users.cdfBalance}::numeric),0)::text`,
      referral: sql<string>`coalesce(sum(${users.referralUsdtBalance}::numeric),0)::text`,
    })
    .from(users);

  if (!row) return 0;
  return liabilityUsdFromSums(row, rates);
}

export async function getWithdrawalsPipelineSnapshot(): Promise<WithdrawalsPipelineSnapshot> {
  const db = getDb();
  const openStatuses = [WithdrawalStatus.PENDING_AGENT, WithdrawalStatus.PROCESSING] as const;

  const [pend] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(withdrawals)
    .where(
      and(eq(withdrawals.status, WithdrawalStatus.PENDING_AGENT), eq(withdrawals.asset, "USDT")),
    );

  const [proc] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(withdrawals)
    .where(and(eq(withdrawals.status, WithdrawalStatus.PROCESSING), eq(withdrawals.asset, "USDT")));

  const [sumRow] = await db
    .select({
      s: sql<string>`coalesce(sum(${withdrawals.amount}::numeric + ${withdrawals.fee}::numeric),0)::text`,
    })
    .from(withdrawals)
    .where(
      and(inArray(withdrawals.status, [...openStatuses]), eq(withdrawals.asset, "USDT")),
    );

  return {
    pendingAgentCount: Number(pend?.c ?? 0) || 0,
    processingCount: Number(proc?.c ?? 0) || 0,
    openUsdtGross: numFromNumeric(sumRow?.s),
  };
}

/**
 * Aggregates user wallet ledger + group treasury ledger by UTC day; includes ops snapshot.
 */
export async function getFinanceCashFlowReport(
  days: number,
): Promise<FinanceCashFlowReport> {
  const d = Math.min(Math.max(1, Math.floor(days)), 365);
  const until = new Date();
  const since = new Date(until.getTime() - d * 24 * 60 * 60 * 1000);

  const rates = await fetchReferenceRates();
  const ratesNote =
    "USD estimates: USDT≈1 USD; PI from OKX PI-USDT; CDF from FX_CDF_PER_USD; fees column stored as USD equivalent where applicable. Group treasury lines are USDT in app flows.";

  const db = getDb();
  const dayUtcUser =
    sql`(date_trunc('day', ${walletLedgerEntries.createdAt} AT TIME ZONE 'UTC'))::date`;
  const dayUtcGroup =
    sql`(date_trunc('day', ${groupWalletLedgerEntries.createdAt} AT TIME ZONE 'UTC'))::date`;

  const [
    aggregated,
    groupAggregated,
    userSums,
    groupLiabilityRow,
    pipeline,
  ] = await Promise.all([
    db
      .select({
        day: dayUtcUser,
        entryType: walletLedgerEntries.entryType,
        asset: walletLedgerEntries.asset,
        amtSum: sql<string>`sum(${walletLedgerEntries.amount}::numeric)::text`,
        feeSum: sql<string>`sum(${walletLedgerEntries.feeUsdEquivalent}::numeric)::text`,
        lineCount: sql<number>`count(*)::int`,
      })
      .from(walletLedgerEntries)
      .where(gte(walletLedgerEntries.createdAt, since))
      .groupBy(dayUtcUser, walletLedgerEntries.entryType, walletLedgerEntries.asset)
      .orderBy(desc(dayUtcUser)),
    db
      .select({
        day: dayUtcGroup,
        entryType: groupWalletLedgerEntries.entryType,
        asset: groupWalletLedgerEntries.asset,
        amtSum: sql<string>`sum(${groupWalletLedgerEntries.amount}::numeric)::text`,
        lineCount: sql<number>`count(*)::int`,
      })
      .from(groupWalletLedgerEntries)
      .where(gte(groupWalletLedgerEntries.createdAt, since))
      .groupBy(dayUtcGroup, groupWalletLedgerEntries.entryType, groupWalletLedgerEntries.asset)
      .orderBy(desc(dayUtcGroup)),
    db
      .select({
        usdt: sql<string>`coalesce(sum(${users.balance}::numeric),0)::text`,
        pi: sql<string>`coalesce(sum(${users.piBalance}::numeric),0)::text`,
        piTest: sql<string>`coalesce(sum(${users.piTestBalance}::numeric),0)::text`,
        usd: sql<string>`coalesce(sum(${users.usdBalance}::numeric),0)::text`,
        cdf: sql<string>`coalesce(sum(${users.cdfBalance}::numeric),0)::text`,
        referral: sql<string>`coalesce(sum(${users.referralUsdtBalance}::numeric),0)::text`,
      })
      .from(users),
    db
      .select({
        s: sql<string>`coalesce(sum(${groupWalletLedgerEntries.amount}::numeric),0)::text`,
      })
      .from(groupWalletLedgerEntries),
    getWithdrawalsPipelineSnapshot(),
  ]);

  const liabilityUsdEstimate = userSums[0]
    ? liabilityUsdFromSums(userSums[0], rates)
    : 0;
  const groupTreasuryLiabilityUsdt = numFromNumeric(groupLiabilityRow[0]?.s);

  const byDay = new Map<
    string,
    {
      buckets: ReturnType<typeof emptyBuckets>;
      feesRecordedUsd: number;
    }
  >();

  let ledgerLinesInRange = 0;
  let periodFeesRecordedUsd = 0;
  const periodTotals = emptyBuckets();

  for (const row of aggregated) {
    const dayStr = parseDay(row.day);
    const amt = numFromNumeric(row.amtSum);
    const feePart = numFromNumeric(row.feeSum);
    const bucket = classifyLedgerEntryType(row.entryType);
    const n = row.lineCount ?? 0;
    ledgerLinesInRange += n;

    const signedUsd = signedUsdForLine(row.asset, amt, rates);
    const prev = byDay.get(dayStr) ?? {
      buckets: emptyBuckets(),
      feesRecordedUsd: 0,
    };
    prev.buckets[bucket].usdSigned += signedUsd;
    prev.buckets[bucket].lineCount += n;
    prev.feesRecordedUsd += feePart;
    byDay.set(dayStr, prev);

    periodTotals[bucket].usdSigned += signedUsd;
    periodTotals[bucket].lineCount += n;
    periodFeesRecordedUsd += feePart;
  }

  const daily: FinanceCashFlowDailyRow[] = [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, v]) => ({
      day,
      buckets: v.buckets,
      feesRecordedUsd: v.feesRecordedUsd,
    }));

  const groupByDay = new Map<
    string,
    { buckets: ReturnType<typeof emptyGroupBuckets> }
  >();
  let groupLedgerLinesInRange = 0;
  const groupTreasuryPeriodTotals = emptyGroupBuckets();

  for (const row of groupAggregated) {
    const dayStr = parseDay(row.day);
    const amt = numFromNumeric(row.amtSum);
    const bucket = classifyGroupLedgerEntryType(row.entryType);
    const n = row.lineCount ?? 0;
    groupLedgerLinesInRange += n;

    const signedUsd = signedUsdForLine(row.asset, amt, rates);
    const prev = groupByDay.get(dayStr) ?? { buckets: emptyGroupBuckets() };
    prev.buckets[bucket].usdSigned += signedUsd;
    prev.buckets[bucket].lineCount += n;
    groupByDay.set(dayStr, prev);

    groupTreasuryPeriodTotals[bucket].usdSigned += signedUsd;
    groupTreasuryPeriodTotals[bucket].lineCount += n;
  }

  const groupTreasuryDaily: GroupTreasuryDailyRow[] = [...groupByDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([day, v]) => ({
      day,
      buckets: v.buckets,
    }));

  return {
    daysRequested: d,
    sinceIso: since.toISOString(),
    untilIso: until.toISOString(),
    liabilityUsdEstimate,
    groupTreasuryLiabilityUsdt,
    ratesNote,
    daily,
    periodTotals,
    periodFeesRecordedUsd,
    ledgerLinesInRange,
    groupTreasuryDaily,
    groupTreasuryPeriodTotals,
    groupLedgerLinesInRange,
    withdrawalsPipeline: pipeline,
  };
}

export type FinanceRecentUserLedgerRow = {
  id: string;
  createdAt: Date;
  entryType: string;
  asset: string;
  amount: number;
  feeUsdEquivalent: number;
  usdSigned: number;
  bucket: CashFlowBucket;
  userId: string;
  userEmail: string;
  avatarUrl: string | null;
};

export type FinanceRecentGroupLedgerRow = {
  id: string;
  createdAt: Date;
  entryType: string;
  asset: string;
  amount: number;
  usdSigned: number;
  bucket: GroupTreasuryBucket;
  groupId: string;
  groupName: string;
};

/** Latest user-wallet ledger lines in range (newest first). For admin drill-down (Phase 2). */
export async function getFinanceRecentUserLedgerLines(
  days: number,
  limit: number,
): Promise<FinanceRecentUserLedgerRow[]> {
  const d = Math.min(Math.max(1, Math.floor(days)), 365);
  const until = new Date();
  const since = new Date(until.getTime() - d * 24 * 60 * 60 * 1000);
  const lim = Math.min(Math.max(1, Math.floor(limit)), 200);

  const rates = await fetchReferenceRates();
  const db = getDb();

  const rows = await db
    .select({
      id: walletLedgerEntries.id,
      createdAt: walletLedgerEntries.createdAt,
      entryType: walletLedgerEntries.entryType,
      asset: walletLedgerEntries.asset,
      amount: walletLedgerEntries.amount,
      feeUsdEquivalent: walletLedgerEntries.feeUsdEquivalent,
      userId: walletLedgerEntries.userId,
      userEmail: users.email,
      avatarUrl: users.avatarUrl,
    })
    .from(walletLedgerEntries)
    .innerJoin(users, eq(walletLedgerEntries.userId, users.id))
    .where(gte(walletLedgerEntries.createdAt, since))
    .orderBy(desc(walletLedgerEntries.createdAt))
    .limit(lim);

  return rows.map((r) => {
    const amt = numFromNumeric(r.amount);
    const fee = numFromNumeric(r.feeUsdEquivalent);
    const bucket = classifyLedgerEntryType(r.entryType);
    const usdSigned = signedUsdForLine(r.asset, amt, rates);
    return {
      id: r.id,
      createdAt: r.createdAt,
      entryType: r.entryType,
      asset: r.asset,
      amount: amt,
      feeUsdEquivalent: fee,
      usdSigned,
      bucket,
      userId: r.userId,
      userEmail: r.userEmail,
      avatarUrl: r.avatarUrl ?? null,
    };
  });
}

/** Latest group treasury ledger lines in range (newest first). */
export async function getFinanceRecentGroupLedgerLines(
  days: number,
  limit: number,
): Promise<FinanceRecentGroupLedgerRow[]> {
  const d = Math.min(Math.max(1, Math.floor(days)), 365);
  const until = new Date();
  const since = new Date(until.getTime() - d * 24 * 60 * 60 * 1000);
  const lim = Math.min(Math.max(1, Math.floor(limit)), 200);

  const rates = await fetchReferenceRates();
  const db = getDb();

  const rows = await db
    .select({
      id: groupWalletLedgerEntries.id,
      createdAt: groupWalletLedgerEntries.createdAt,
      entryType: groupWalletLedgerEntries.entryType,
      asset: groupWalletLedgerEntries.asset,
      amount: groupWalletLedgerEntries.amount,
      groupId: groupWalletLedgerEntries.groupId,
      groupName: groupSavingsGroups.name,
    })
    .from(groupWalletLedgerEntries)
    .innerJoin(
      groupSavingsGroups,
      eq(groupWalletLedgerEntries.groupId, groupSavingsGroups.id),
    )
    .where(gte(groupWalletLedgerEntries.createdAt, since))
    .orderBy(desc(groupWalletLedgerEntries.createdAt))
    .limit(lim);

  return rows.map((r) => {
    const amt = numFromNumeric(r.amount);
    const bucket = classifyGroupLedgerEntryType(r.entryType);
    const usdSigned = signedUsdForLine(r.asset, amt, rates);
    return {
      id: r.id,
      createdAt: r.createdAt,
      entryType: r.entryType,
      asset: r.asset,
      amount: amt,
      usdSigned,
      bucket,
      groupId: r.groupId,
      groupName: r.groupName,
    };
  });
}

function csvEscapeCell(cell: string): string {
  return cell.includes(",") || cell.includes('"') || cell.includes("\n")
    ? `"${cell.replace(/"/g, '""')}"`
    : cell;
}

export function financeRecentUserLedgerToCsv(
  rows: FinanceRecentUserLedgerRow[],
  bucketLabels: Record<CashFlowBucket, string>,
): string {
  const header = [
    "when_utc",
    "entry_type",
    "asset",
    "amount",
    "fee_usd_eq",
    "usd_signed_est",
    "bucket",
    "user_email",
    "user_id",
  ];
  const lines: string[][] = [header];
  for (const r of rows) {
    lines.push([
      r.createdAt.toISOString(),
      r.entryType,
      r.asset,
      String(r.amount),
      String(r.feeUsdEquivalent),
      String(r.usdSigned),
      bucketLabels[r.bucket],
      r.userEmail,
      r.userId,
    ]);
  }
  return lines.map((r) => r.map(csvEscapeCell).join(",")).join("\n");
}

export function financeRecentGroupLedgerToCsv(
  rows: FinanceRecentGroupLedgerRow[],
  bucketLabels: Record<GroupTreasuryBucket, string>,
): string {
  const header = [
    "when_utc",
    "entry_type",
    "asset",
    "amount",
    "usd_signed_est",
    "bucket",
    "group_name",
    "group_id",
  ];
  const lines: string[][] = [header];
  for (const r of rows) {
    lines.push([
      r.createdAt.toISOString(),
      r.entryType,
      r.asset,
      String(r.amount),
      String(r.usdSigned),
      bucketLabels[r.bucket],
      r.groupName,
      r.groupId,
    ]);
  }
  return lines.map((r) => r.map(csvEscapeCell).join(",")).join("\n");
}

export function financeCashFlowToCsv(
  report: FinanceCashFlowReport,
  labels: Record<CashFlowBucket, string>,
): string {
  const header = [
    "section",
    "day",
    ...CASH_FLOW_BUCKETS.map((k) => labels[k]),
    "fees_recorded_usd",
    "lines_in_buckets_sum",
  ];
  const rows: string[][] = [header];
  for (const row of report.daily) {
    rows.push([
      "user_wallet_ledger",
      row.day,
      ...CASH_FLOW_BUCKETS.map((k) => String(row.buckets[k].usdSigned)),
      String(row.feesRecordedUsd),
      String(CASH_FLOW_BUCKETS.reduce((s, k) => s + row.buckets[k].lineCount, 0)),
    ]);
  }
  rows.push([
    "user_wallet_ledger_total",
    "period_total",
    ...CASH_FLOW_BUCKETS.map((k) => String(report.periodTotals[k].usdSigned)),
    String(report.periodFeesRecordedUsd),
    String(report.ledgerLinesInRange),
  ]);
  return rows
    .map((r) => r.map((cell) => csvEscapeCell(String(cell))).join(","))
    .join("\n");
}

export function groupTreasuryCashFlowToCsv(
  report: FinanceCashFlowReport,
  labels: Record<GroupTreasuryBucket, string>,
): string {
  const header = [
    "section",
    "day",
    ...GROUP_TREASURY_BUCKETS.map((k) => labels[k]),
    "lines_in_buckets_sum",
  ];
  const rows: string[][] = [header];
  for (const row of report.groupTreasuryDaily) {
    rows.push([
      "group_treasury_ledger",
      row.day,
      ...GROUP_TREASURY_BUCKETS.map((k) => String(row.buckets[k].usdSigned)),
      String(
        GROUP_TREASURY_BUCKETS.reduce((s, k) => s + row.buckets[k].lineCount, 0),
      ),
    ]);
  }
  rows.push([
    "group_treasury_ledger_total",
    "period_total",
    ...GROUP_TREASURY_BUCKETS.map((k) =>
      String(report.groupTreasuryPeriodTotals[k].usdSigned),
    ),
    String(report.groupLedgerLinesInRange),
  ]);
  return rows
    .map((r) => r.map((cell) => csvEscapeCell(String(cell))).join(","))
    .join("\n");
}

export function financeReportToFullCsv(
  report: FinanceCashFlowReport,
  userLabels: Record<CashFlowBucket, string>,
  groupLabels: Record<GroupTreasuryBucket, string>,
): string {
  const meta = [
    `# McBuleli finance export`,
    `# period_days=${report.daysRequested}`,
    `# withdrawals_open_usdt_gross=${report.withdrawalsPipeline.openUsdtGross}`,
    `# group_treasury_liability_usdt=${report.groupTreasuryLiabilityUsdt}`,
    `# user_custodial_liability_usd_est=${report.liabilityUsdEstimate}`,
    ``,
  ].join("\n");

  return (
    meta +
    financeCashFlowToCsv(report, userLabels) +
    "\n\n" +
    groupTreasuryCashFlowToCsv(report, groupLabels)
  );
}
