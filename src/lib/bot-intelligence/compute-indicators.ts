import {
  ATR,
  EMA,
  IchimokuCloud,
  RSI,
  SMA,
} from "technicalindicators";
import type {
  FibLevels,
  IndicatorSnapshot,
  OhlcvCandle,
} from "@/lib/bot-intelligence/types";

function last<T>(arr: T[]): T | undefined {
  return arr.length ? arr[arr.length - 1] : undefined;
}

function computeFib(candles: OhlcvCandle[]): FibLevels | null {
  if (candles.length < 20) return null;
  const slice = candles.slice(-50);
  let swingHigh = -Infinity;
  let swingLow = Infinity;
  for (const c of slice) {
    if (c.high > swingHigh) swingHigh = c.high;
    if (c.low < swingLow) swingLow = c.low;
  }
  const range = swingHigh - swingLow;
  if (!Number.isFinite(range) || range <= 0) return null;
  return {
    swingHigh,
    swingLow,
    level382: swingHigh - range * 0.382,
    level500: swingHigh - range * 0.5,
    level618: swingHigh - range * 0.618,
  };
}

export function computeIndicators(candles: OhlcvCandle[]): IndicatorSnapshot {
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);

  const rsiArr = RSI.calculate({ values: closes, period: 14 });
  const ema20Arr = EMA.calculate({ values: closes, period: 20 });
  const ema50Arr = EMA.calculate({ values: closes, period: 50 });
  const sma200Arr =
    closes.length >= 200
      ? SMA.calculate({ values: closes, period: 200 })
      : [];
  const atrArr = ATR.calculate({
    high: highs,
    low: lows,
    close: closes,
    period: 14,
  });

  const ichi = IchimokuCloud.calculate({
    high: highs,
    low: lows,
    conversionPeriod: 9,
    basePeriod: 26,
    spanPeriod: 52,
    displacement: 26,
  });
  const ichiLast = last(ichi);
  const price = last(closes) ?? 0;
  let aboveCloud: boolean | null = null;
  if (ichiLast && Number.isFinite(ichiLast.spanA) && Number.isFinite(ichiLast.spanB)) {
    const cloudTop = Math.max(ichiLast.spanA, ichiLast.spanB);
    aboveCloud = price > cloudTop;
  }

  return {
    rsi14: last(rsiArr) ?? null,
    ema20: last(ema20Arr) ?? null,
    ema50: last(ema50Arr) ?? null,
    sma200: last(sma200Arr) ?? null,
    ichimoku: {
      tenkan: ichiLast?.conversion ?? null,
      kijun: ichiLast?.base ?? null,
      spanA: ichiLast?.spanA ?? null,
      spanB: ichiLast?.spanB ?? null,
      aboveCloud,
    },
    fib: computeFib(candles),
    atr14: last(atrArr) ?? null,
  };
}
