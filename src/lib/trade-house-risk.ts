import { and, eq } from "drizzle-orm";
import { getDb, tradeFuturesPositions } from "@/db";
import { TRADE_FEE_RATE } from "@/lib/trade-config";
import {
  tradeHouseWinHaircutRate,
  tradeHouseWinHaircutThresholdUsdt,
} from "@/lib/trade-house-haircut";
import {
  computeTradeHouseReserveUsdt,
  tradeHouseReserveFloorUsdt,
  type TradeHouseReserveBreakdown,
} from "@/lib/trade-house-reserve";
import {
  positionQtyBase,
  unrealizedPnlUsdt,
} from "@/lib/trade-math";
import { fetchSymbolTicker } from "@/lib/trade-price";
import { numFromNumeric } from "@/lib/wallet-types";

/** @deprecated Use async reserve via computeTradeHouseReserveUsdt - floor only. */
export function tradeHouseReserveUsdt(): number {
  return tradeHouseReserveFloorUsdt();
}

/** Block new live opens when stress liability / reserve exceeds this (0–1). */
export function tradeHouseUtilizationCap(): number {
  const n = Number(process.env.TRADE_HOUSE_UTILIZATION_MAX ?? "0.85");
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.85;
}

/** Adverse move vs house if all traders are on the winning side simultaneously. */
export function tradeHouseStressMovePct(): number {
  const n = Number(process.env.TRADE_HOUSE_STRESS_MOVE_PCT ?? "0.06");
  return Number.isFinite(n) && n > 0 && n < 0.5 ? n : 0.06;
}

export function tradeHouseCircuitForced(): boolean {
  const v = String(process.env.TRADE_LIVE_HOUSE_CIRCUIT ?? "0").toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

export type HouseAlertLevel = "ok" | "warn" | "danger";

export type HouseRiskSnapshot = {
  reserveUsdt: number;
  reserveBreakdown: TradeHouseReserveBreakdown;
  markToMarketLiabilityUsdt: number;
  stressLiabilityUsdt: number;
  utilizationPct: number;
  stressUtilizationPct: number;
  circuitTripped: boolean;
  stressMovePct: number;
  maxLeverageWhileStressed: number;
  alertLevel: HouseAlertLevel;
  haircutThresholdUsdt: number;
  haircutRate: number;
};

function payoutIfClosedAtMark(args: {
  margin: number;
  unreal: number;
  feeClose: number;
}): number {
  const raw = args.margin + args.unreal - args.feeClose;
  return Math.max(0, raw);
}

function stressedMark(
  side: "long" | "short",
  mark: number,
  stressMove: number,
): number {
  if (side === "long") return mark * (1 + stressMove);
  return mark * (1 - stressMove);
}

async function liabilityForOpenLivePositions(): Promise<{
  markToMarket: number;
  stress: number;
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tradeFuturesPositions)
    .where(
      and(
        eq(tradeFuturesPositions.status, "open"),
        eq(tradeFuturesPositions.isDemo, false),
      ),
    )
    .limit(2000);

  const tickerCache = new Map<string, number>();
  let markToMarket = 0;
  let stress = 0;
  const stressMove = tradeHouseStressMovePct();

  for (const p of rows) {
    const symbol = p.symbol;
    let mark = tickerCache.get(symbol);
    if (mark == null) {
      const t = await fetchSymbolTicker(symbol);
      mark = t?.lastPrice ?? 0;
      tickerCache.set(symbol, mark);
    }
    if (!Number.isFinite(mark) || mark <= 0) continue;

    const margin = numFromNumeric(p.marginUsdt?.toString());
    const qty = numFromNumeric(p.qtyBase?.toString());
    const entry = numFromNumeric(p.entryPrice?.toString());
    const side = p.side === "short" ? "short" : "long";
    let unreal = unrealizedPnlUsdt({ side, qtyBase: qty, entry, mark });
    if (unreal < -margin) unreal = -margin;

    const feeClose = TRADE_FEE_RATE * qty * mark;
    markToMarket += payoutIfClosedAtMark({ margin, unreal, feeClose });

    const sMark = stressedMark(side, mark, stressMove);
    let stressUnreal = unrealizedPnlUsdt({
      side,
      qtyBase: qty,
      entry,
      mark: sMark,
    });
    if (stressUnreal < -margin) stressUnreal = -margin;
    const stressFeeClose = TRADE_FEE_RATE * qty * sMark;
    stress += payoutIfClosedAtMark({
      margin,
      unreal: stressUnreal,
      feeClose: stressFeeClose,
    });
  }

  return { markToMarket, stress };
}

function projectedNewPositionStress(args: {
  marginUsdt: number;
  leverage: number;
  side: "long" | "short";
  entry: number;
}): { mark: number; stress: number } {
  const { marginUsdt, leverage, side, entry } = args;
  const qty = positionQtyBase(marginUsdt, leverage, entry);
  const stressMove = tradeHouseStressMovePct();
  const feeClose = TRADE_FEE_RATE * qty * entry;
  const markPayout = payoutIfClosedAtMark({
    margin: marginUsdt,
    unreal: 0,
    feeClose,
  });

  const sMark = stressedMark(side, entry, stressMove);
  const stressUnreal = unrealizedPnlUsdt({
    side,
    qtyBase: qty,
    entry,
    mark: sMark,
  });
  const stressFeeClose = TRADE_FEE_RATE * qty * sMark;
  const stressPayout = payoutIfClosedAtMark({
    margin: marginUsdt,
    unreal: stressUnreal,
    feeClose: stressFeeClose,
  });

  return { mark: markPayout, stress: stressPayout };
}

function houseAlertLevel(args: {
  circuitTripped: boolean;
  stressUtilizationPct: number;
  cap: number;
}): HouseAlertLevel {
  if (args.circuitTripped || args.stressUtilizationPct >= args.cap) {
    return "danger";
  }
  if (args.stressUtilizationPct >= 0.7) return "warn";
  return "ok";
}

export async function getHouseRiskSnapshot(): Promise<HouseRiskSnapshot> {
  const reserveBreakdown = await computeTradeHouseReserveUsdt();
  const reserve = reserveBreakdown.totalReserveUsdt;
  const cap = tradeHouseUtilizationCap();
  const stressMove = tradeHouseStressMovePct();
  const { markToMarket, stress } = await liabilityForOpenLivePositions();

  const utilizationPct = reserve > 0 ? markToMarket / reserve : 1;
  const stressUtilizationPct = reserve > 0 ? stress / reserve : 1;
  const circuitTripped =
    tradeHouseCircuitForced() ||
    stressUtilizationPct >= cap ||
    utilizationPct >= 1;

  let maxLeverageWhileStressed = 10;
  if (stressUtilizationPct >= 0.55) maxLeverageWhileStressed = 5;

  return {
    reserveUsdt: reserve,
    reserveBreakdown,
    markToMarketLiabilityUsdt: markToMarket,
    stressLiabilityUsdt: stress,
    utilizationPct,
    stressUtilizationPct,
    circuitTripped,
    stressMovePct: stressMove,
    maxLeverageWhileStressed,
    alertLevel: houseAlertLevel({ circuitTripped, stressUtilizationPct, cap }),
    haircutThresholdUsdt: tradeHouseWinHaircutThresholdUsdt(),
    haircutRate: tradeHouseWinHaircutRate(),
  };
}

export async function assertHouseCapacityForNewPosition(args: {
  marginUsdt: number;
  leverage: number;
  side: "long" | "short";
  entryPrice: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const snap = await getHouseRiskSnapshot();
  if (snap.circuitTripped) {
    return { ok: false, message: "trade_house_circuit" };
  }

  if (args.leverage > snap.maxLeverageWhileStressed) {
    return { ok: false, message: "trade_house_leverage_cap" };
  }

  const projected = projectedNewPositionStress({
    marginUsdt: args.marginUsdt,
    leverage: args.leverage,
    side: args.side,
    entry: args.entryPrice,
  });

  const reserve = snap.reserveUsdt;
  const cap = tradeHouseUtilizationCap();
  const stressTotal = snap.stressLiabilityUsdt + projected.stress;

  if (reserve > 0 && stressTotal / reserve > cap + 1e-9) {
    return { ok: false, message: "trade_house_capacity" };
  }

  return { ok: true };
}
