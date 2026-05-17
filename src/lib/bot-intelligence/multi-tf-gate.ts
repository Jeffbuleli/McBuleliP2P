import type { BotEnvironment } from "@/lib/bot-config";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import { BOT_CANDLE_TIMEFRAMES } from "@/lib/bot-smart-config";
import { fetchMarketContext } from "@/lib/bot-intelligence/fetch-market-context";
import {
  evaluateTradeSignal,
  signalAllowsLong,
  signalAllowsShort,
  signalAllowsSpotBuy,
  signalSummary,
} from "@/lib/bot-intelligence/evaluate-signal";
import type { MarketKind, TradeSignal } from "@/lib/bot-intelligence/types";

type SmartGateResult =
  | { ok: true; signal: TradeSignal }
  | { ok: false; reason: string; signal?: TradeSignal };

const TF_RANK: Record<(typeof BOT_CANDLE_TIMEFRAMES)[number], number> = {
  "15m": 0,
  "1h": 1,
  "4h": 2,
};

export function isHigherTimeframe(
  entry: (typeof BOT_CANDLE_TIMEFRAMES)[number],
  confirm: (typeof BOT_CANDLE_TIMEFRAMES)[number],
): boolean {
  return TF_RANK[confirm] > TF_RANK[entry];
}

export async function runMultiTfSmartGate(args: {
  environment: BotEnvironment;
  symbol: string;
  market: MarketKind;
  smart: BotSmartConfig;
  intent: "long" | "short" | "spot_buy";
  confirmTimeframe: (typeof BOT_CANDLE_TIMEFRAMES)[number];
}): Promise<SmartGateResult & { confirmSignal?: TradeSignal }> {
  const entryGate = await runSingleTfGate({
    environment: args.environment,
    symbol: args.symbol,
    market: args.market,
    smart: args.smart,
    intent: args.intent,
  });
  if (!entryGate.ok) return entryGate;

  if (!isHigherTimeframe(args.smart.timeframe, args.confirmTimeframe)) {
    return entryGate;
  }

  const confirmCtx = await fetchMarketContext({
    environment: args.environment,
    symbol: args.symbol,
    market: args.market,
    timeframe: args.confirmTimeframe,
  });
  if (!confirmCtx) {
    return { ok: false, reason: "smart_market_data_unavailable", signal: entryGate.signal };
  }

  const confirmSignal = evaluateTradeSignal(confirmCtx);
  const min = args.smart.minSignalScore;

  if (args.intent === "long" && !signalAllowsLong(confirmSignal, min)) {
    return {
      ok: false,
      reason: "smart_mtf_blocks_long",
      signal: entryGate.signal,
      confirmSignal,
    };
  }
  if (args.intent === "short" && !signalAllowsShort(confirmSignal, min)) {
    return {
      ok: false,
      reason: "smart_mtf_blocks_short",
      signal: entryGate.signal,
      confirmSignal,
    };
  }
  if (args.intent === "spot_buy" && !signalAllowsSpotBuy(confirmSignal, min)) {
    return {
      ok: false,
      reason: "smart_mtf_blocks_buy",
      signal: entryGate.signal,
      confirmSignal,
    };
  }

  return { ok: true, signal: entryGate.signal, confirmSignal };
}

async function runSingleTfGate(args: {
  environment: BotEnvironment;
  symbol: string;
  market: MarketKind;
  smart: BotSmartConfig;
  intent: "long" | "short" | "spot_buy";
}): Promise<SmartGateResult> {
  if (!args.smart.smartMode) {
    return {
      ok: true,
      signal: {
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
      },
    };
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
    return { ok: false, reason: "smart_signal_blocks_long", signal };
  }
  if (args.intent === "short" && !signalAllowsShort(signal, min)) {
    return { ok: false, reason: "smart_signal_blocks_short", signal };
  }
  if (args.intent === "spot_buy" && !signalAllowsSpotBuy(signal, min)) {
    return { ok: false, reason: "smart_signal_blocks_buy", signal };
  }

  return { ok: true, signal };
}

export function multiTfGateSummary(
  entry: TradeSignal,
  confirm: TradeSignal,
  entryTf: string,
  confirmTf: string,
): string {
  return `${entryTf} ${signalSummary(entry)} · ${confirmTf} ${signalSummary(confirm)}`;
}
