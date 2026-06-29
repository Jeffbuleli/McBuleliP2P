/**
 * Layer 1 - Technical Engine (primary direction).
 * Rule-based multi-factor score; no AI in this layer.
 */

import {
  evaluateTradeSignal,
  signalAllowsLong,
  signalAllowsShort,
  signalAllowsSpotBuy,
} from "@/lib/bot-intelligence/evaluate-signal";
import { fetchMarketContext } from "@/lib/bot-intelligence/fetch-market-context";
import type { BotEnvironment } from "@/lib/bot-config";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import type { MarketKind, TradeSignal } from "@/lib/bot-intelligence/types";
import {
  smoothScore,
  scoreToConfidence,
} from "@/lib/bot-decision/score-smoothing";
import type {
  MarketRegime,
  TechnicalEngineOutput,
  TechnicalSignal,
} from "@/lib/bot-decision/types";
import type { DecisionReasonCode } from "@/lib/bot-decision/reason-codes";

export type TechnicalEvaluateArgs = {
  environment: BotEnvironment;
  symbol: string;
  market: MarketKind;
  smart: BotSmartConfig;
  intent: "long" | "short" | "spot_buy";
  confirmTimeframe?: string | null;
  previousSmoothedScore?: number | null;
};

export type TechnicalReject = {
  ok: false;
  reason_code: DecisionReasonCode;
  reason_message: string;
  output?: TechnicalEngineOutput;
};

export type TechnicalOk = {
  ok: true;
  output: TechnicalEngineOutput;
  /** True when entry passes min score for intent */
  allows_entry: boolean;
};

function detectRegime(signal: TradeSignal): MarketRegime {
  const ind = signal.context.indicators;
  const price = signal.context.price;
  if (ind.atr14 != null && price > 0) {
    const atrPct = (ind.atr14 / price) * 100;
    if (atrPct > 3.5) return "VOLATILE";
  }
  if (Math.abs(signal.score) < 18) return "RANGE";
  return "TREND";
}

function scoreToTechnicalSignal(
  score: number,
  minEdge: number,
): TechnicalSignal {
  if (score >= minEdge) return "LONG";
  if (score <= -minEdge) return "SHORT";
  return "NEUTRAL";
}

function buildOutput(
  entrySignal: TradeSignal,
  smoothed: number,
  raw: number,
  confirmSignal?: TradeSignal,
): TechnicalEngineOutput {
  const minEdge = 12;
  return {
    signal: scoreToTechnicalSignal(smoothed, minEdge),
    score: smoothed,
    rawScore: raw,
    confidence: scoreToConfidence(Math.abs(smoothed)),
    reasons: entrySignal.reasons,
    timeframe_analysis: {
      entry: {
        timeframe: entrySignal.context.timeframe,
        score: smoothed,
        bias: entrySignal.bias,
      },
      ...(confirmSignal
        ? {
            confirm: {
              timeframe: confirmSignal.context.timeframe,
              score: confirmSignal.score,
              bias: confirmSignal.bias,
            },
          }
        : {}),
    },
    market_regime: detectRegime(entrySignal),
    tradeSignal: { ...entrySignal, score: smoothed },
    confirmSignal,
  };
}

export async function runTechnicalEngine(
  args: TechnicalEvaluateArgs,
): Promise<TechnicalOk | TechnicalReject> {
  if (!args.smart.smartMode) {
    const placeholder: TradeSignal = {
      score: 0,
      bias: "neutral",
      reasons: ["smart_mode_off"],
      context: {
        symbol: args.symbol,
        market: args.market,
        timeframe: args.smart.timeframe,
        price: 0,
        volume24h: null,
        candles: [],
        indicators: {
          rsi14: null,
          ema20: null,
          ema50: null,
          sma200: null,
          ichimoku: {
            tenkan: null,
            kijun: null,
            spanA: null,
            spanB: null,
            aboveCloud: null,
          },
          fib: null,
          atr14: null,
        },
        orderBook: null,
        fundingRate: null,
        openInterest: null,
      },
    };
    const out = buildOutput(placeholder, 0, 0);
    return { ok: true, output: out, allows_entry: true };
  }

  const entryCtx = await fetchMarketContext({
    environment: args.environment,
    symbol: args.symbol,
    market: args.market,
    timeframe: args.smart.timeframe,
  });

  if (!entryCtx) {
    return {
      ok: false,
      reason_code: "MARKET_DATA_UNAVAILABLE",
      reason_message: "Entry timeframe market data unavailable",
    };
  }

  const rawEntry = evaluateTradeSignal(entryCtx);
  const smoothedEntry = smoothScore(
    rawEntry.score,
    args.previousSmoothedScore ?? null,
  );
  const entrySignal: TradeSignal = { ...rawEntry, score: smoothedEntry };

  let confirmSignal: TradeSignal | undefined;
  if (args.confirmTimeframe) {
    const confirmCtx = await fetchMarketContext({
      environment: args.environment,
      symbol: args.symbol,
      market: args.market,
      timeframe: args.confirmTimeframe as BotSmartConfig["timeframe"],
    });
    if (!confirmCtx) {
      return {
        ok: false,
        reason_code: "MARKET_DATA_UNAVAILABLE",
        reason_message: "Confirm timeframe market data unavailable",
        output: buildOutput(entrySignal, smoothedEntry, rawEntry.score),
      };
    }
    confirmSignal = evaluateTradeSignal(confirmCtx);
  }

  const output = buildOutput(
    entrySignal,
    smoothedEntry,
    rawEntry.score,
    confirmSignal,
  );

  const min = args.smart.minSignalScore;
  let allows_entry =
    args.intent === "spot_buy"
      ? signalAllowsSpotBuy(entrySignal, min)
      : args.intent === "long"
        ? signalAllowsLong(entrySignal, min)
        : signalAllowsShort(entrySignal, min);

  if (allows_entry && confirmSignal) {
    const confirmOk =
      args.intent === "spot_buy"
        ? signalAllowsSpotBuy(confirmSignal, min)
        : args.intent === "long"
          ? signalAllowsLong(confirmSignal, min)
          : signalAllowsShort(confirmSignal, min);
    if (!confirmOk) {
      return {
        ok: false,
        reason_code: "TREND_CONFLICT",
        reason_message: `Higher TF (${args.confirmTimeframe}) does not confirm ${args.intent} (entry ${smoothedEntry}, confirm ${confirmSignal.score})`,
        output,
      };
    }
  }

  if (!allows_entry) {
    const code: DecisionReasonCode =
      output.market_regime === "RANGE"
        ? "RANGE_MARKET"
        : output.market_regime === "VOLATILE"
          ? "HIGH_VOLATILITY"
          : Math.abs(smoothedEntry) < min * 0.5
            ? "WEAK_MOMENTUM"
            : "LOW_SCORE";
    return {
      ok: false,
      reason_code: code,
      reason_message: `Technical score ${smoothedEntry} below threshold ±${min} for ${args.intent}`,
      output,
    };
  }

  return { ok: true, output, allows_entry: true };
}

/** Technical direction aligns with bot configured side */
export function technicalAlignsWithBot(
  technical: TechnicalEngineOutput,
  botSide: "LONG" | "SHORT",
): boolean {
  if (botSide === "LONG") {
    return technical.signal === "LONG" || technical.score >= 12;
  }
  return technical.signal === "SHORT" || technical.score <= -12;
}
