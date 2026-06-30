import type {
  MarketContext,
  TradeSignal,
} from "@/lib/bot-intelligence/types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function biasFromScore(score: number): TradeSignal["bias"] {
  if (score >= 55) return "strong_long";
  if (score >= 20) return "long";
  if (score <= -55) return "strong_short";
  if (score <= -20) return "short";
  return "neutral";
}

/** Rule-based multi-factor score (not financial advice). */
export function evaluateTradeSignal(ctx: MarketContext): TradeSignal {
  let score = 0;
  const reasons: string[] = [];
  const { indicators: ind, price, orderBook, fundingRate } = ctx;

  if (ind.rsi14 != null) {
    if (ind.rsi14 < 32) {
      score += 18;
      reasons.push("RSI oversold");
    } else if (ind.rsi14 > 68) {
      score -= 18;
      reasons.push("RSI overbought");
    } else if (ind.rsi14 > 55) {
      score += 6;
      reasons.push("RSI bullish");
    } else if (ind.rsi14 < 45) {
      score -= 6;
      reasons.push("RSI bearish");
    }
  }

  if (ind.ema20 != null && ind.ema50 != null) {
    if (ind.ema20 > ind.ema50 && price > ind.ema20) {
      score += 14;
      reasons.push("EMA trend up");
    } else if (ind.ema20 < ind.ema50 && price < ind.ema20) {
      score -= 14;
      reasons.push("EMA trend down");
    }
  }

  if (ind.sma200 != null) {
    if (price > ind.sma200) {
      score += 8;
      reasons.push("Above SMA200");
    } else {
      score -= 8;
      reasons.push("Below SMA200");
    }
  }

  if (ind.ichimoku.aboveCloud === true) {
    score += 12;
    reasons.push("Ichimoku above cloud");
  } else if (ind.ichimoku.aboveCloud === false) {
    score -= 12;
    reasons.push("Ichimoku below cloud");
  }

  if (ind.ichimoku.tenkan != null && ind.ichimoku.kijun != null) {
    if (ind.ichimoku.tenkan > ind.ichimoku.kijun) {
      score += 6;
      reasons.push("TK cross bullish");
    } else {
      score -= 6;
      reasons.push("TK cross bearish");
    }
  }

  if (ind.fib) {
    const near618 =
      Math.abs(price - ind.fib.level618) / price < 0.008;
    const near382 =
      Math.abs(price - ind.fib.level382) / price < 0.008;
    if (near618) {
      score += 10;
      reasons.push("Near Fib 61.8% support");
    }
    if (near382 && price < ind.fib.level500) {
      score -= 8;
      reasons.push("Near Fib 38.2% resistance");
    }
  }

  if (orderBook) {
    if (orderBook.imbalance > 0.12) {
      score += 10;
      reasons.push("Order book bid pressure");
    } else if (orderBook.imbalance < -0.12) {
      score -= 10;
      reasons.push("Order book ask pressure");
    }
  }

  if (fundingRate != null) {
    if (fundingRate < -0.0001) {
      score += 5;
      reasons.push("Negative funding (long bias)");
    } else if (fundingRate > 0.0003) {
      score -= 5;
      reasons.push("High positive funding");
    }
  }

  if (ind.atr14 != null && price > 0) {
    const atrPct = (ind.atr14 / price) * 100;
    if (atrPct > 3.5) {
      score = Math.round(score * 0.7);
      reasons.push("High volatility — score dampened");
    }
  }

  score = clamp(Math.round(score), -100, 100);

  return {
    score,
    bias: biasFromScore(score),
    reasons: reasons.slice(0, 8),
    context: ctx,
  };
}

export function signalAllowsLong(signal: TradeSignal, minScore: number): boolean {
  return signal.score >= minScore;
}

export function signalAllowsShort(signal: TradeSignal, minScore: number): boolean {
  return signal.score <= -minScore;
}

export function signalAllowsSpotBuy(signal: TradeSignal, minScore: number): boolean {
  return signal.score >= minScore;
}

export function signalSummary(signal: TradeSignal): string {
  return `${signal.bias} (${signal.score})`;
}
