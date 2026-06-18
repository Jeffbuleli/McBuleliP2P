import { and, desc, asc, eq, inArray, notInArray } from "drizzle-orm";
import { matchesHistoryCategory } from "@/lib/wallet-history-labels";
import { getDb, deposits, fiatFreshpayTransactions, walletLedgerEntries, withdrawals } from "@/db";
import { DepositStatus, WithdrawalStatus } from "@/lib/status";
import type { WalletCryptoAsset } from "@/lib/wallet-crypto-assets";

export type ActivityStatus = "processing" | "completed" | "failed";

export type WalletActivityItem = {
  id: string;
  kind: "deposit" | "withdrawal" | "ledger" | "fiat_tx";
  refId: string;
  entryType?: string;
  fiatOp?: "deposit" | "payout";
  fiatRail?: "momo" | "card";
  status: ActivityStatus;
  amount: string;
  asset: string;
  createdAt: string;
  resumeHref: string | null;
  detailHref: string;
  txid?: string | null;
  feeUsdEquivalent?: string | null;
  meta?: Record<string, unknown> | null;
  destination?: string | null;
};

const TERMINAL_DEPOSIT = [DepositStatus.CONFIRMED, DepositStatus.FAILED] as string[];
const TERMINAL_WITHDRAWAL = [
  WithdrawalStatus.COMPLETED,
  WithdrawalStatus.REJECTED,
  WithdrawalStatus.FAILED,
] as string[];

function depositStatusToActivity(status: string): ActivityStatus {
  if (status === DepositStatus.FAILED) return "failed";
  if (status === DepositStatus.CONFIRMED) return "completed";
  return "processing";
}

function withdrawalStatusToActivity(status: string): ActivityStatus {
  if (status === WithdrawalStatus.REJECTED || status === WithdrawalStatus.FAILED) {
    return "failed";
  }
  if (status === WithdrawalStatus.COMPLETED) return "completed";
  return "processing";
}

function fiatStatusToActivity(status: string): ActivityStatus {
  if (status === "FAILED") return "failed";
  if (status === "COMPLETED") return "completed";
  return "processing";
}

export async function fetchWalletActivitiesForAsset(args: {
  userId: string;
  asset: WalletCryptoAsset;
  sort: "newest" | "oldest";
  page: number;
  pageSize: number;
}): Promise<{
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const db = getDb();
  const order = args.sort === "oldest" ? asc : desc;

  const [depositRows, withdrawalRows, ledgerRows] = await Promise.all([
    db
      .select({
        id: deposits.id,
        status: deposits.status,
        amount: deposits.amount,
        declaredAmountUsdt: deposits.declaredAmountUsdt,
        asset: deposits.asset,
        createdAt: deposits.createdAt,
        txid: deposits.txid,
        addressShown: deposits.addressShown,
      })
      .from(deposits)
      .where(and(eq(deposits.userId, args.userId), eq(deposits.asset, args.asset)))
      .orderBy(order(deposits.createdAt))
      .limit(120),
    db
      .select({
        id: withdrawals.id,
        status: withdrawals.status,
        amount: withdrawals.amount,
        asset: withdrawals.asset,
        createdAt: withdrawals.createdAt,
        txid: withdrawals.txid,
        toAddress: withdrawals.toAddress,
      })
      .from(withdrawals)
      .where(and(eq(withdrawals.userId, args.userId), eq(withdrawals.asset, args.asset)))
      .orderBy(order(withdrawals.createdAt))
      .limit(120),
    db
      .select({
        id: walletLedgerEntries.id,
        entryType: walletLedgerEntries.entryType,
        amount: walletLedgerEntries.amount,
        asset: walletLedgerEntries.asset,
        createdAt: walletLedgerEntries.createdAt,
        meta: walletLedgerEntries.meta,
        feeUsdEquivalent: walletLedgerEntries.feeUsdEquivalent,
      })
      .from(walletLedgerEntries)
      .where(
        and(
          eq(walletLedgerEntries.userId, args.userId),
          eq(walletLedgerEntries.asset, args.asset),
        ),
      )
      .orderBy(order(walletLedgerEntries.createdAt)),
  ]);

  const merged: WalletActivityItem[] = [];

  for (const d of depositRows) {
    const amt =
      d.amount?.toString() ||
      d.declaredAmountUsdt?.toString() ||
      "0";
    const st = depositStatusToActivity(d.status);
    merged.push({
      id: `deposit-${d.id}`,
      kind: "deposit",
      refId: d.id,
      status: st,
      amount: amt,
      asset: d.asset,
      createdAt: d.createdAt.toISOString(),
      resumeHref:
        st === "processing" ? `/app/wallet/activity/deposit/${d.id}` : null,
      detailHref: `/app/wallet/activity/deposit/${d.id}`,
      txid: d.txid,
      destination: d.addressShown,
    });
  }

  for (const w of withdrawalRows) {
    const st = withdrawalStatusToActivity(w.status);
    merged.push({
      id: `withdrawal-${w.id}`,
      kind: "withdrawal",
      refId: w.id,
      status: st,
      amount: w.amount.toString(),
      asset: w.asset,
      createdAt: w.createdAt.toISOString(),
      resumeHref: null,
      detailHref: `/app/wallet/activity/withdraw/${w.id}`,
      txid: w.txid,
      destination: w.toAddress,
    });
  }

  for (const r of ledgerRows) {
    const meta = r.meta;
    const dest =
      typeof meta?.toAddress === "string"
        ? meta.toAddress
        : typeof meta?.address === "string"
          ? meta.address
          : null;
    merged.push({
      id: `ledger-${r.id}`,
      kind: "ledger",
      refId: r.id,
      entryType: r.entryType,
      status: "completed",
      amount: r.amount.toString(),
      asset: r.asset,
      createdAt: r.createdAt.toISOString(),
      resumeHref: null,
      detailHref: `/app/wallet/activity/ledger/${r.id}`,
      feeUsdEquivalent: r.feeUsdEquivalent?.toString() ?? null,
      meta: r.meta,
      destination: dest,
    });
  }

  merged.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return args.sort === "oldest" ? ta - tb : tb - ta;
  });

  const total = merged.length;
  const pageSize = Math.min(Math.max(args.pageSize, 1), 30);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(args.page, 1), totalPages);
  const start = (page - 1) * pageSize;
  const items = merged.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}

/** Latest open deposit for asset (resume after interruption). */
export async function fetchOpenDepositForAsset(
  userId: string,
  asset: WalletCryptoAsset,
): Promise<{ id: string; status: string; createdAt: string } | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: deposits.id,
      status: deposits.status,
      createdAt: deposits.createdAt,
    })
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, userId),
        eq(deposits.asset, asset),
        inArray(deposits.status, [
          DepositStatus.AWAITING_TRANSFER,
          DepositStatus.AWAITING_TXID,
          DepositStatus.PENDING_VALIDATION,
        ]),
      ),
    )
    .orderBy(desc(deposits.createdAt))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function fetchWalletGlobalActivities(args: {
  userId: string;
  category?: string;
  realm?: "crypto" | "fiat";
  asset?: string;
  sort: "newest" | "oldest";
  page: number;
  pageSize: number;
}): Promise<{
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const db = getDb();
  const order = args.sort === "oldest" ? asc : desc;
  const assetFilter = args.asset?.trim();

  const depositWhere = assetFilter
    ? and(eq(deposits.userId, args.userId), eq(deposits.asset, assetFilter))
    : eq(deposits.userId, args.userId);
  const withdrawalWhere = assetFilter
    ? and(eq(withdrawals.userId, args.userId), eq(withdrawals.asset, assetFilter))
    : eq(withdrawals.userId, args.userId);
  const ledgerWhere = assetFilter
    ? and(eq(walletLedgerEntries.userId, args.userId), eq(walletLedgerEntries.asset, assetFilter))
    : eq(walletLedgerEntries.userId, args.userId);

  const fiatWhere = assetFilter
    ? and(
        eq(fiatFreshpayTransactions.userId, args.userId),
        eq(fiatFreshpayTransactions.currency, assetFilter),
      )
    : eq(fiatFreshpayTransactions.userId, args.userId);

  const [depositRows, withdrawalRows, ledgerRows, fiatRows] = await Promise.all([
    db
      .select({
        id: deposits.id,
        status: deposits.status,
        amount: deposits.amount,
        declaredAmountUsdt: deposits.declaredAmountUsdt,
        asset: deposits.asset,
        createdAt: deposits.createdAt,
        txid: deposits.txid,
        addressShown: deposits.addressShown,
      })
      .from(deposits)
      .where(depositWhere)
      .orderBy(order(deposits.createdAt))
      .limit(150),
    db
      .select({
        id: withdrawals.id,
        status: withdrawals.status,
        amount: withdrawals.amount,
        asset: withdrawals.asset,
        createdAt: withdrawals.createdAt,
        txid: withdrawals.txid,
        toAddress: withdrawals.toAddress,
      })
      .from(withdrawals)
      .where(withdrawalWhere)
      .orderBy(order(withdrawals.createdAt))
      .limit(150),
    db
      .select({
        id: walletLedgerEntries.id,
        entryType: walletLedgerEntries.entryType,
        amount: walletLedgerEntries.amount,
        asset: walletLedgerEntries.asset,
        createdAt: walletLedgerEntries.createdAt,
        meta: walletLedgerEntries.meta,
        feeUsdEquivalent: walletLedgerEntries.feeUsdEquivalent,
      })
      .from(walletLedgerEntries)
      .where(ledgerWhere)
      .orderBy(order(walletLedgerEntries.createdAt))
      .limit(300),
    db
      .select({
        reference: fiatFreshpayTransactions.reference,
        kind: fiatFreshpayTransactions.kind,
        status: fiatFreshpayTransactions.status,
        currency: fiatFreshpayTransactions.currency,
        amount: fiatFreshpayTransactions.amount,
        provider: fiatFreshpayTransactions.provider,
        meta: fiatFreshpayTransactions.meta,
        createdAt: fiatFreshpayTransactions.createdAt,
      })
      .from(fiatFreshpayTransactions)
      .where(fiatWhere)
      .orderBy(order(fiatFreshpayTransactions.createdAt))
      .limit(150),
  ]);

  const merged: WalletActivityItem[] = [];
  const fiatRefs = new Set(fiatRows.map((f) => f.reference));

  function ledgerFiatRef(meta: Record<string, unknown> | null | undefined): string | null {
    if (typeof meta?.fiatDepositRef === "string") return meta.fiatDepositRef;
    if (typeof meta?.fiatPayoutRef === "string") return meta.fiatPayoutRef;
    return null;
  }

  for (const d of depositRows) {
    const amt =
      d.amount?.toString() || d.declaredAmountUsdt?.toString() || "0";
    const st = depositStatusToActivity(d.status);
    merged.push({
      id: `deposit-${d.id}`,
      kind: "deposit",
      refId: d.id,
      status: st,
      amount: amt,
      asset: d.asset,
      createdAt: d.createdAt.toISOString(),
      resumeHref: st === "processing" ? `/app/wallet/activity/deposit/${d.id}` : null,
      detailHref: `/app/wallet/activity/deposit/${d.id}`,
      txid: d.txid,
      destination: d.addressShown,
    });
  }

  for (const w of withdrawalRows) {
    const st = withdrawalStatusToActivity(w.status);
    merged.push({
      id: `withdrawal-${w.id}`,
      kind: "withdrawal",
      refId: w.id,
      status: st,
      amount: w.amount.toString(),
      asset: w.asset,
      createdAt: w.createdAt.toISOString(),
      resumeHref: null,
      detailHref: `/app/wallet/activity/withdraw/${w.id}`,
      txid: w.txid,
      destination: w.toAddress,
    });
  }

  for (const r of ledgerRows) {
    const et = r.entryType ?? "";
    if (et.startsWith("fiat_")) {
      const ref = ledgerFiatRef(r.meta);
      if (ref && fiatRefs.has(ref)) continue;
    }
    const meta = r.meta;
    const dest =
      typeof meta?.toAddress === "string"
        ? meta.toAddress
        : typeof meta?.address === "string"
          ? meta.address
          : null;
    merged.push({
      id: `ledger-${r.id}`,
      kind: "ledger",
      refId: r.id,
      entryType: r.entryType,
      status: "completed",
      amount: r.amount.toString(),
      asset: r.asset,
      createdAt: r.createdAt.toISOString(),
      resumeHref: null,
      detailHref: `/app/wallet/activity/ledger/${r.id}`,
      feeUsdEquivalent: r.feeUsdEquivalent?.toString() ?? null,
      meta: r.meta,
      destination: dest,
    });
  }

  for (const f of fiatRows) {
    const st = fiatStatusToActivity(f.status);
    const meta = f.meta ?? {};
    const rail =
      meta.rail === "card" || f.provider === "card" ? ("card" as const) : ("momo" as const);
    const fiatOp = f.kind === "payout" ? ("payout" as const) : ("deposit" as const);
    merged.push({
      id: `fiat-${f.reference}`,
      kind: "fiat_tx",
      refId: f.reference,
      fiatOp,
      fiatRail: rail,
      status: st,
      amount: f.amount,
      asset: f.currency,
      createdAt: f.createdAt.toISOString(),
      resumeHref:
        st === "processing" ? `/app/wallet/fiat/status/${encodeURIComponent(f.reference)}` : null,
      detailHref: `/app/wallet/fiat/status/${encodeURIComponent(f.reference)}`,
      meta: f.meta,
    });
  }

  const category = args.category?.trim() ?? "";
  const realm = args.realm;
  let filtered = category
    ? merged.filter((item) => matchesHistoryCategory(item, category))
    : merged;

  if (realm === "fiat") {
    filtered = filtered.filter(
      (item) => item.kind === "fiat_tx" || (item.entryType ?? "").startsWith("fiat_"),
    );
  } else if (realm === "crypto") {
    filtered = filtered.filter(
      (item) => item.kind !== "fiat_tx" && !(item.entryType ?? "").startsWith("fiat_"),
    );
  }

  filtered.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return args.sort === "oldest" ? ta - tb : tb - ta;
  });

  const total = filtered.length;
  const pageSize = Math.min(Math.max(args.pageSize, 1), 30);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(args.page, 1), totalPages);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}
