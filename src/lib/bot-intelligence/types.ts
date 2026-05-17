import type { BotCandleTimeframe } from "@/lib/bot-smart-config";

export type CandleTimeframe = BotCandleTimeframe;

export type MarketKind = "spot" | "futures";

export type OhlcvCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type FibLevels = {
  swingHigh: number;
  swingLow: number;
  level382: number;
  level500: number;
  level618: number;
};

export type IndicatorSnapshot = {
  rsi14: number | null;
  ema20: number | null;
  ema50: number | null;
  sma200: number | null;
  ichimoku: {
    tenkan: number | null;
    kijun: number | null;
    spanA: number | null;
    spanB: number | null;
    aboveCloud: boolean | null;
  };
  fib: FibLevels | null;
  atr14: number | null;
};

export type OrderBookSummary = {
  bidVolume: number;
  askVolume: number;
  /** Positive = more bid pressure. */
  imbalance: number;
};

export type MarketContext = {
  symbol: string;
  market: MarketKind;
  timeframe: CandleTimeframe;
  price: number;
  volume24h: number | null;
  candles: OhlcvCandle[];
  indicators: IndicatorSnapshot;
  orderBook: OrderBookSummary | null;
  fundingRate: number | null;
  openInterest: number | null;
};

/** -100 (bearish) … +100 (bullish) */
export type TradeSignal = {
  score: number;
  bias: "strong_long" | "long" | "neutral" | "short" | "strong_short";
  reasons: string[];
  context: MarketContext;
};
