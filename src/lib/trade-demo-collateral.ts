import { and, eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";
import { fetchSymbolTicker } from "@/lib/trade-price";
import { fmtTradeAmount } from "@/lib/trade-math";
import { debitTradeDemoUsdt } from "@/lib/trade-demo-balance";
import { numFromNumeric } from "@/lib/wallet-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbLike = any;

/** PI/USDT mark for converting Pi Test → USDT notional in practice trading only. */
export async function fetchPiUsdMark(): Promise<number> {
  const t = await fetchSymbolTicker("PIUSDT");
  const p = t?.lastPrice;
  if (!Number.isFinite(p) || !p || p <= 0 || t?.stale) return 0;
  return p;
}

export type DemoCollateralSnapshot = {
  demoUsdt: number;
  piTest: number;
  piUsd: number;
  demoPiTestUsd: number;
  effectiveUsdt: number;
};

export async function getDemoCollateralSnapshot(
  demoUsdtStr: string | null | undefined,
  piTestStr: string | null | undefined,
): Promise<DemoCollateralSnapshot> {
  const demoUsdt = numFromNumeric(demoUsdtStr?.toString());
  const piTest = numFromNumeric(piTestStr?.toString());
  const piUsd = await fetchPiUsdMark();
  const demoPiTestUsd =
    piUsd > 0 && piTest > 0 ? piTest * piUsd : 0;
  return {
    demoUsdt,
    piTest,
    piUsd,
    demoPiTestUsd,
    effectiveUsdt: demoUsdt + demoPiTestUsd,
  };
}

/**
 * Demo positions debit virtual USDT first, then Pi Test (converted at PIUSDT mark).
 * Closing positions still credits virtual USDT only (training simplicity).
 */
export async function debitDemoTradingCollateral(
  tx: DbLike,
  userId: string,
  totalDebitUsdt: number,
  piUsd: number,
): Promise<void> {
  const [u] = await tx
    .select({
      tradeDemoUsdtBalance: users.tradeDemoUsdtBalance,
      piTestBalance: users.piTestBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) throw new Error("user");

  const demoBal = numFromNumeric(u.tradeDemoUsdtBalance?.toString());
  const piBal = numFromNumeric(u.piTestBalance?.toString());
  const piTestUsd =
    piUsd > 0 && Number.isFinite(piUsd) ? piBal * piUsd : 0;

  if (demoBal + piTestUsd + 1e-18 < totalDebitUsdt) {
    throw new Error("insufficient");
  }

  let remaining = totalDebitUsdt;
  const useDemo = Math.min(demoBal, remaining);
  if (useDemo > 1e-18) {
    await debitTradeDemoUsdt(tx, userId, fmtTradeAmount(useDemo));
    remaining -= useDemo;
  }

  if (remaining > 1e-12) {
    if (!(piUsd > 0 && Number.isFinite(piUsd))) {
      throw new Error("pi_price_unavailable");
    }
    const piNeeded = remaining / piUsd;
    const r = await debitPiTestBalance(tx, userId, fmtTradeAmount(piNeeded));
    if (!r.ok) throw new Error("insufficient");
  }
}

async function debitPiTestBalance(
  tx: DbLike,
  userId: string,
  amtStr: string,
): Promise<{ ok: true } | { ok: false }> {
  const rows = await tx
    .update(users)
    .set({
      piTestBalance: sql`${users.piTestBalance} - ${amtStr}::numeric`,
    })
    .where(
      and(
        eq(users.id, userId),
        sql`${users.piTestBalance} >= ${amtStr}::numeric`,
      ),
    )
    .returning({ id: users.id });
  return rows.length > 0 ? { ok: true } : { ok: false };
}
