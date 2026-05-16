import type { BotEnvironment } from "@/lib/bot-config";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import { fetchMarketContext } from "@/lib/bot-intelligence/fetch-market-context";
import {
  evaluateTradeSignal,
  signalAllowsLong,
  signalAllowsShort,
  signalAllowsSpotBuy,
  signalSummary,
} from "@/lib/bot-intelligence/evaluate-signal";
import type { MarketKind, TradeSignal } from "@/lib/bot-intelligence/types";

export type SmartGateResult =
  | { ok: true; signal: TradeSignal }
  | { ok: false; reason: string; signal?: TradeSignal };

export async function runSmartGate(args: {
  environment: BotEnvironment;
  symbol: string;
  market: MarketKind;
  smart: BotSmartConfig;
  intent: "long" | "short" | "spot_buy";
}): Promise<SmartGateResult> {
  if (!args.smart.smartMode) {
    return { ok: true, signal: placeholderSignal(args.symbol, args.market) };
  }

  const ctx = await fetchMarketContext({
    environment: args.environment,
    symbol: args.symbol,
    market: args.market,
    timeframe: args.smart.timeframe,
  });

  if (!ctx) {
    return { ok: false, reason: "smart_market_data_unavailable" };
  }

  const signal = evaluateTradeSignal(ctx);
  const min = args.smart.minSignalScore;

  if (args.intent === "long" && !signalAllowsLong(signal, min)) {
    return {
      ok: false,
      reason: "smart_signal_blocks_long",
      signal,
    };
  }
  if (args.intent === "short" && !signalAllowsShort(signal, min)) {
    return {
      ok: false,
      reason: "smart_signal_blocks_short",
      signal,
    };
  }
  if (args.intent === "spot_buy" && !signalAllowsSpotBuy(signal, min)) {
    return {
      ok: false,
      reason: "smart_signal_blocks_buy",
      signal,
    };
  }

  return { ok: true, signal };
}

function placeholderSignal(symbol: string, market: MarketKind): TradeSignal {
  return {
    score: 0,
    bias: "neutral",
    reasons: ["smart_mode_off"],
    context: {
      symbol,
      market,
      timeframe: "1h",
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
}

export {
  evaluateTradeSignal,
  fetchMarketContext,
  signalAllowsLong,
  signalAllowsShort,
  signalAllowsSpotBuy,
  signalSummary,
};
export type { MarketContext, TradeSignal, MarketKind } from "@/lib/bot-intelligence/types";
