import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getDemoCollateralSnapshot } from "@/lib/trade-demo-collateral";
import { fmtTradeAmount } from "@/lib/trade-math";
import {
  getTradeLiveGovernance,
  type TradeLiveGovernanceSnapshot,
} from "@/lib/trade-live-governance";

export type TradeModeSnapshot = {
  demoUsdt: string;
  piTest: string;
  piUsd: string;
  demoPiTestUsd: string;
  demoEffectiveUsdt: string;
  tradeLiveEnabled: boolean;
  governance: TradeLiveGovernanceSnapshot;
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
  const governance = await getTradeLiveGovernance(userId);
  if (!governance) return null;

  return {
    demoUsdt: u.tradeDemoUsdtBalance?.toString() ?? "0",
    piTest: u.piTestBalance?.toString() ?? "0",
    piUsd: fmtTradeAmount(snap.piUsd),
    demoPiTestUsd: fmtTradeAmount(snap.demoPiTestUsd),
    demoEffectiveUsdt: fmtTradeAmount(snap.effectiveUsdt),
    tradeLiveEnabled: u.tradeLiveEnabled,
    governance,
  };
}
