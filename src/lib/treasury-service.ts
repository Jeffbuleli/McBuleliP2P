import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, platformSettings, users, walletLedgerEntries } from "@/db";
import { countPendingFiatFreshpay } from "@/lib/fiat-freshpay-db";
import { cdfPerOneUsd } from "@/lib/fx";
import { numFromNumeric } from "@/lib/wallet-types";

export type TreasuryCoverage = {
  asset: "USD" | "CDF" | "USDT";
  reserve: number;
  liability: number;
  coveragePct: number;
  level: "ok" | "warn" | "danger";
};

export type TreasuryFlowWindow = {
  inUsd: number;
  outUsd: number;
  count: number;
};

export type TreasuryReport = {
  coverages: TreasuryCoverage[];
  flows: {
    h24: TreasuryFlowWindow;
    d7: TreasuryFlowWindow;
    d30: TreasuryFlowWindow;
  };
  profits: {
    fiatFeesUsd: number;
    swapFeesUsd: number;
    walletFeesUsd: number;
    totalUsd: number;
  };
  pendingFiat: { processing: number; failed24h: number };
};

const FIAT_FLOW_TYPES = [
  "fiat_deposit",
  "fiat_withdraw",
  "fiat_withdraw_refund",
  "fiat_deposit_reversal",
] as const;

function coverageLevel(pct: number): TreasuryCoverage["level"] {
  if (pct < 100) return "danger";
  if (pct < 120) return "warn";
  return "ok";
}

function isMissingRelationError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code =
    (err as { code?: string }).code ??
    (err as { cause?: { code?: string } }).cause?.code;
  return code === "42P01";
}

function metaRef(meta: Record<string, unknown> | null | undefined): string | null {
  const v = meta?.fiatDepositRef;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function readReserve(key: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);
  const n = Number(row?.value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

async function sumLiabilities(): Promise<{ usd: number; cdf: number; usdt: number }> {
  const db = getDb();
  const [row] = await db
    .select({
      usd: sql<string>`coalesce(sum(${users.usdBalance}), 0)`,
      cdf: sql<string>`coalesce(sum(${users.cdfBalance}), 0)`,
      usdt: sql<string>`coalesce(sum(${users.balance}), 0)`,
    })
    .from(users);
  return {
    usd: numFromNumeric(row?.usd),
    cdf: numFromNumeric(row?.cdf),
    usdt: numFromNumeric(row?.usdt),
  };
}

async function completedFreshpayDepositRefs(refs: string[]): Promise<Set<string>> {
  if (refs.length === 0) return new Set();
  const db = getDb();
  try {
    const rows = await db
      .select({ reference: fiatFreshpayTransactions.reference })
      .from(fiatFreshpayTransactions)
      .where(
        and(
          inArray(fiatFreshpayTransactions.reference, refs),
          eq(fiatFreshpayTransactions.kind, "deposit"),
          eq(fiatFreshpayTransactions.status, "COMPLETED"),
        ),
      );
    return new Set(rows.map((r) => r.reference));
  } catch (e) {
    if (isMissingRelationError(e)) return new Set();
    throw e;
  }
}

async function fiatFlowSince(since: Date): Promise<TreasuryFlowWindow> {
  const db = getDb();
  const rows = await db
    .select({
      entryType: walletLedgerEntries.entryType,
      amount: walletLedgerEntries.amount,
      asset: walletLedgerEntries.asset,
      meta: walletLedgerEntries.meta,
    })
    .from(walletLedgerEntries)
    .where(
      and(
        gte(walletLedgerEntries.createdAt, since),
        inArray(walletLedgerEntries.entryType, [...FIAT_FLOW_TYPES]),
      ),
    )
    .limit(5000);

  const reversalRefs = new Set<string>();
  for (const r of rows) {
    if (r.entryType !== "fiat_deposit_reversal") continue;
    const ref = metaRef(r.meta);
    if (ref) reversalRefs.add(ref);
  }

  const depositRefs = rows
    .filter((r) => r.entryType === "fiat_deposit")
    .map((r) => metaRef(r.meta))
    .filter((ref): ref is string => Boolean(ref));

  const completedRefs = await completedFreshpayDepositRefs(depositRefs);

  let inUsd = 0;
  let outUsd = 0;
  let count = 0;
  const cdfRate = cdfPerOneUsd();

  for (const r of rows) {
    if (r.entryType === "fiat_deposit") {
      const ref = metaRef(r.meta);
      if (!ref || !completedRefs.has(ref) || reversalRefs.has(ref)) continue;
    }

    const n = Number(r.amount);
    if (!Number.isFinite(n)) continue;
    count += 1;

    const abs =
      r.asset === "USD"
        ? Math.abs(n)
        : r.asset === "CDF"
          ? Math.abs(n) / cdfRate
          : Math.abs(n);

    if (r.entryType === "fiat_deposit" || r.entryType === "fiat_withdraw_refund") {
      inUsd += abs;
    } else {
      outUsd += abs;
    }
  }

  return { inUsd, outUsd, count };
}

async function fiatFeesSince(since: Date): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      feeUsd: walletLedgerEntries.feeUsdEquivalent,
      meta: walletLedgerEntries.meta,
    })
    .from(walletLedgerEntries)
    .where(
      and(
        gte(walletLedgerEntries.createdAt, since),
        eq(walletLedgerEntries.entryType, "fiat_deposit"),
      ),
    );

  const depositRefs = rows
    .map((r) => metaRef(r.meta))
    .filter((ref): ref is string => Boolean(ref));
  const completedRefs = await completedFreshpayDepositRefs(depositRefs);

  let total = 0;
  for (const r of rows) {
    const ref = metaRef(r.meta);
    if (ref && !completedRefs.has(ref)) continue;
    total += numFromNumeric(r.feeUsd);
  }
  return total;
}

export async function getTreasuryReport(): Promise<TreasuryReport> {
  const now = Date.now();
  const h24 = new Date(now - 24 * 3600_000);
  const d7 = new Date(now - 7 * 24 * 3600_000);
  const d30 = new Date(now - 30 * 24 * 3600_000);

  const [liab, resUsd, resCdf, resUsdt, f24, f7, f30, fees30, pending] = await Promise.all([
    sumLiabilities(),
    readReserve("treasury_reserve_usd"),
    readReserve("treasury_reserve_cdf"),
    readReserve("treasury_reserve_usdt"),
    fiatFlowSince(h24),
    fiatFlowSince(d7),
    fiatFlowSince(d30),
    fiatFeesSince(d30),
    countPendingFiatFreshpay({ failedSince: h24 }),
  ]);

  const coverages: TreasuryCoverage[] = [
    {
      asset: "USD" as const,
      reserve: resUsd,
      liability: liab.usd,
      coveragePct: liab.usd > 0 ? (resUsd / liab.usd) * 100 : resUsd > 0 ? 999 : 0,
      level: "ok",
    },
    {
      asset: "CDF" as const,
      reserve: resCdf,
      liability: liab.cdf,
      coveragePct: liab.cdf > 0 ? (resCdf / liab.cdf) * 100 : resCdf > 0 ? 999 : 0,
      level: "ok",
    },
    {
      asset: "USDT" as const,
      reserve: resUsdt,
      liability: liab.usdt,
      coveragePct: liab.usdt > 0 ? (resUsdt / liab.usdt) * 100 : resUsdt > 0 ? 999 : 0,
      level: "ok",
    },
  ].map((c) => ({ ...c, level: coverageLevel(c.coveragePct) }));

  return {
    coverages,
    flows: { h24: f24, d7: f7, d30: f30 },
    profits: {
      fiatFeesUsd: fees30,
      swapFeesUsd: 0,
      walletFeesUsd: fees30,
      totalUsd: fees30,
    },
    pendingFiat: pending,
  };
}
