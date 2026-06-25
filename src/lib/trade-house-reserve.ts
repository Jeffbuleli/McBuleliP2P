import { eq, sql } from "drizzle-orm";
import { getDb, tradeFuturesPositions, users } from "@/db";
import { numFromNumeric } from "@/lib/wallet-types";

export type TradeHouseReserveBreakdown = {
  floorUsdt: number;
  treasuryBalanceUsdt: number;
  liveFeesUsdt: number;
  totalReserveUsdt: number;
};

export function tradeHouseTreasuryUserId(): string | null {
  const id =
    process.env.TRADE_HOUSE_TREASURY_USER_ID?.trim() ||
    process.env.P2P_FEE_TREASURY_USER_ID?.trim() ||
    null;
  return id && id.length > 10 ? id : null;
}

export function tradeHouseReserveFloorUsdt(): number {
  const envFloor = Number(process.env.TRADE_HOUSE_RESERVE_FLOOR_USDT ?? "0");
  const legacy = Number(process.env.TRADE_HOUSE_RESERVE_USDT ?? "25000");
  const floor = Number.isFinite(envFloor) && envFloor > 0 ? envFloor : legacy;
  return Number.isFinite(floor) && floor > 0 ? floor : 25000;
}

async function sumLiveFuturesFeesUsdt(): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      s: sql<string>`coalesce(
        sum(
          coalesce(${tradeFuturesPositions.feeOpenUsdt}::numeric, 0)
          + coalesce(${tradeFuturesPositions.feeCloseUsdt}::numeric, 0)
        ),
        0
      )`,
    })
    .from(tradeFuturesPositions)
    .where(eq(tradeFuturesPositions.isDemo, false));
  return numFromNumeric(row?.s ?? "0");
}

export async function computeTradeHouseReserveUsdt(): Promise<TradeHouseReserveBreakdown> {
  const floorUsdt = tradeHouseReserveFloorUsdt();
  let treasuryBalanceUsdt = 0;
  const treasuryId = tradeHouseTreasuryUserId();

  if (treasuryId) {
    const db = getDb();
    const [u] = await db
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, treasuryId))
      .limit(1);
    treasuryBalanceUsdt = numFromNumeric(u?.balance?.toString() ?? "0");
  }

  const liveFeesUsdt = await sumLiveFuturesFeesUsdt();
  const dynamic = treasuryBalanceUsdt + liveFeesUsdt;
  const totalReserveUsdt = Math.max(floorUsdt, dynamic);

  return {
    floorUsdt,
    treasuryBalanceUsdt,
    liveFeesUsdt,
    totalReserveUsdt,
  };
}
