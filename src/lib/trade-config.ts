/** Exchange-style defaults — conservative caps for retail. */

export const TRADE_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "PIUSDT"] as const;
export type TradeSymbol = (typeof TRADE_SYMBOLS)[number];

export function isTradeSymbol(s: string): s is TradeSymbol {
  return (TRADE_SYMBOLS as readonly string[]).includes(s);
}

export const TRADE_LEVERAGES = [2, 5, 10] as const;
export type TradeLeverage = (typeof TRADE_LEVERAGES)[number];

export const TRADE_FEE_RATE = 0.0005; // 5 bps per side on notional
export const TRADE_MAINT_MARGIN_RATE = 0.004;

export const TRADE_MIN_MARGIN_USDT = 5;
export function tradeMaxMarginUsdt(): number {
  const n = Number(process.env.TRADE_MAX_MARGIN_USDT ?? "10000");
  return Number.isFinite(n) && n > 0 ? n : 10000;
}

export const TRADE_MAX_OPEN_FUTURES = 10;
/** Until this many closed futures trades, max leverage is capped at `beginnerMaxLev`. */
export const TRADE_BEGINNER_CLOSED_TRADES = 5;
export const TRADE_BEGINNER_MAX_LEVERAGE = 5;

export const TRADE_OPTIONS_DURATIONS_SEC = [60, 300, 900, 3600] as const;
export const TRADE_OPTIONS_PAYOUT_PCT = 75;
export const TRADE_OPTIONS_FEE_RATE = 0.01;

export function tradeMaxOptionsStakeUsdt(): number {
  const n = Number(process.env.TRADE_MAX_OPTIONS_STAKE_USDT ?? "500");
  return Number.isFinite(n) && n > 0 ? n : 500;
}
