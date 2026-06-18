import { and, eq, gte, sql } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, platformSettings, users, walletLedgerEntries } from "@/db";
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

function coverageLevel(pct: number): TreasuryCoverage["level"] {
  if (pct < 100) return "danger";
  if (pct < 120) return "warn";
  return "ok";
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

async function fiatFlowSince(since: Date): Promise<TreasuryFlowWindow> {
  const db = getDb();
  const rows = await db
    .select({
      entryType: walletLedgerEntries.entryType,
      amount: walletLedgerEntries.amount,
      asset: walletLedgerEntries.asset,
      feeUsd: walletLedgerEntries.feeUsdEquivalent,
    })
    .from(walletLedgerEntries)
    .where(
      and(
        gte(walletLedgerEntries.createdAt, since),
        sql`${walletLedgerEntries.entryType} in ('fiat_deposit', 'fiat_withdraw', 'fiat_withdraw_refund')`,
      ),
    )
    .limit(5000);

  let inUsd = 0;
  let outUsd = 0;
  const cdfRate = cdfPerOneUsd();
  for (const r of rows) {
    const n = Number(r.amount);
    if (!Number.isFinite(n)) continue;
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
  return { inUsd, outUsd, count: rows.length };
}

async function fiatFeesSince(since: Date): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      s: sql<string>`coalesce(sum(${walletLedgerEntries.feeUsdEquivalent}), 0)`,
    })
    .from(walletLedgerEntries)
    .where(
      and(
        gte(walletLedgerEntries.createdAt, since),
        eq(walletLedgerEntries.entryType, "fiat_deposit"),
      ),
    );
  return numFromNumeric(row?.s);
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
    (async () => {
      const db = getDb();
      const [proc] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(fiatFreshpayTransactions)
        .where(eq(fiatFreshpayTransactions.status, "PROCESSING"));
      const [fail] = await db
        .select({ c: sql<number>`count(*)::int` })
        .from(fiatFreshpayTransactions)
        .where(
          and(
            eq(fiatFreshpayTransactions.status, "FAILED"),
            gte(fiatFreshpayTransactions.updatedAt, h24),
          ),
        );
      return { processing: proc?.c ?? 0, failed24h: fail?.c ?? 0 };
    })(),
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
