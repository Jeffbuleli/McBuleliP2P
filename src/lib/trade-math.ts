import { TRADE_FEE_RATE, TRADE_MAINT_MARGIN_RATE } from "@/lib/trade-config";

export function fmtTradeAmount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(18);
}

/** Isolated linear perp — liquidation approximation (MMR included). */
export function liquidationPrice(params: {
  entry: number;
  side: "long" | "short";
  leverage: number;
}): number {
  const { entry, side, leverage } = params;
  const L = Math.max(1, leverage);
  const mm = TRADE_MAINT_MARGIN_RATE;
  if (side === "long") {
    return entry * (1 - 1 / L + mm);
  }
  return entry * (1 + 1 / L - mm);
}

export function positionQtyBase(marginUsdt: number, leverage: number, entry: number): number {
  const notional = marginUsdt * leverage;
  return entry > 0 ? notional / entry : 0;
}

export function unrealizedPnlUsdt(params: {
  side: "long" | "short";
  qtyBase: number;
  entry: number;
  mark: number;
}): number {
  const { side, qtyBase, entry, mark } = params;
  if (side === "long") return qtyBase * (mark - entry);
  return qtyBase * (entry - mark);
}

export function feeOnNotional(notionalUsdt: number): number {
  return notionalUsdt * TRADE_FEE_RATE;
}

export function notionalUsdt(marginUsdt: number, leverage: number): number {
  return marginUsdt * leverage;
}
