import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getDemoCollateralSnapshot } from "@/lib/trade-demo-collateral";
import { fmtTradeAmount } from "@/lib/trade-math";

export type TradeModeSnapshot = {
  demoUsdt: string;
  /** Pi Test balance (Pi Network sandbox / training). */
  piTest: string;
  /** PI/USDT reference used for practice collateral (same feed as wallet PI display). */
  piUsd: string;
  /** Pi Test × piUsd — counts toward practice margin together with demoUsdt. */
  demoPiTestUsd: string;
  /** demoUsdt + demoPiTestUsd (USDT notional). */
  demoEffectiveUsdt: string;
  tradeLiveEnabled: boolean;
};

export async function getTradeModeSnapshot(
  userId: string,
): Promise<TradeModeSnapshot | null> {
  const db = getDb();
  const [u] = await db
    .select({
      tradeDemoUsdtBalance: users.tradeDemoUsdtBalance,
      piTestBalance: users.piTestBalance,
      tradeLiveEnabled: users.tradeLiveEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;
  const snap = await getDemoCollateralSnapshot(
    u.tradeDemoUsdtBalance?.toString(),
    u.piTestBalance?.toString(),
  );
  return {
    demoUsdt: u.tradeDemoUsdtBalance?.toString() ?? "0",
    piTest: u.piTestBalance?.toString() ?? "0",
    piUsd: fmtTradeAmount(snap.piUsd),
    demoPiTestUsd: fmtTradeAmount(snap.demoPiTestUsd),
    demoEffectiveUsdt: fmtTradeAmount(snap.effectiveUsdt),
    tradeLiveEnabled: u.tradeLiveEnabled,
  };
}

export async function enableTradeLive(userId: string): Promise<boolean> {
  const db = getDb();
  const r = await db
    .update(users)
    .set({ tradeLiveEnabled: true })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return r.length > 0;
}
