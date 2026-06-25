import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb, tradeFuturesPositions } from "@/db";
import { numFromNumeric } from "@/lib/wallet-types";

export type AdminFuturesTradeStats = {
  liveOpenPositions: number;
  demoOpenPositions: number;
  liveUsersWithOpen: number;
  liquidations24h: number;
  liveClosed24h: number;
  platformFees24hUsdt: number;
  userLosses24hUsdt: number;
};

export async function getAdminFuturesTradeStats(): Promise<AdminFuturesTradeStats> {
  const db = getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [openLive] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    );

  const [openDemo] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, true),
      ),
    );

  const [liveUsers] = await db
    .select({
      c: sql<number>`count(distinct ${tradeFuturesPositions.userId})::int`,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    );

  const closed24 = await db
    .select({
      closeReason: tradeFuturesPositions.closeReason,
      feeOpen: tradeFuturesPositions.feeOpenUsdt,
      feeClose: tradeFuturesPositions.feeCloseUsdt,
      realized: tradeFuturesPositions.realizedPnlUsdt,
      isDemo: tradeFuturesPositions.isDemo,
    })
    .from(tradeFuturesPositions)
    .where(
      and(
        inArray(tradeFuturesPositions.status, ["closed", "liquidated"]),
        gte(tradeFuturesPositions.closedAt, since),
      ),
    );

  let liquidations24h = 0;
  let liveClosed24h = 0;
  let platformFees24hUsdt = 0;
  let userLosses24hUsdt = 0;

  for (const row of closed24) {
    if (!row.isDemo) liveClosed24h += 1;
    if (row.closeReason === "liquidated") liquidations24h += 1;
    const feeOpen = numFromNumeric(row.feeOpen?.toString() ?? "0");
    const feeClose = numFromNumeric(row.feeClose?.toString() ?? "0");
    platformFees24hUsdt += feeOpen + feeClose;
    const pnl = numFromNumeric(row.realized?.toString() ?? "0");
    if (pnl < 0) userLosses24hUsdt += -pnl;
  }

  return {
    liveOpenPositions: openLive?.c ?? 0,
    demoOpenPositions: openDemo?.c ?? 0,
    liveUsersWithOpen: liveUsers?.c ?? 0,
    liquidations24h,
    liveClosed24h,
    platformFees24hUsdt,
    userLosses24hUsdt,
  };
}
