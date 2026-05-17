import type { BotEnvironment } from "@/lib/bot-config";
import { fetchMarketContext } from "@/lib/bot-intelligence/fetch-market-context";
import {
  evaluateTradeSignal,
  signalAllowsLong,
  signalAllowsShort,
  signalSummary,
} from "@/lib/bot-intelligence/evaluate-signal";
import type { BotSmartConfig } from "@/lib/bot-smart-config";
import type { TradeSignal } from "@/lib/bot-intelligence/types";

export type FuturesSmartExitConfig = {
  smartExitMode: boolean;
  minReversalScore: number;
  minProfitPctForSmartExit: number;
  timeframe: BotSmartConfig["timeframe"];
};

export function unrealizedProfitPct(args: {
  side: "LONG" | "SHORT";
  entry: number;
  mark: number;
}): number {
  const { side, entry, mark } = args;
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(mark)) return 0;
  if (side === "LONG") return ((mark - entry) / entry) * 100;
  return ((entry - mark) / entry) * 100;
}

export type SmartExitCheckResult =
  | {
      close: true;
      signal: TradeSignal;
      profitPct: number;
    }
  | {
      close: false;
      reason: string;
      signal?: TradeSignal;
      profitPct: number;
    };

/** Close open futures position when TA flips against the trade and min profit is met. */
export async function runFuturesSmartExitCheck(args: {
  environment: BotEnvironment;
  symbol: string;
  positionSide: "LONG" | "SHORT";
  entry: number;
  mark: number;
  config: FuturesSmartExitConfig;
}): Promise<SmartExitCheckResult> {
  const profitPct = unrealizedProfitPct({
    side: args.positionSide,
    entry: args.entry,
    mark: args.mark,
  });

  const ctx = await fetchMarketContext({
    environment: args.environment,
    symbol: args.symbol,
    market: "futures",
    timeframe: args.config.timeframe,
  });

  if (!ctx) {
    return {
      close: false,
      reason: "smart_market_data_unavailable",
      profitPct,
    };
  }

  const signal = evaluateTradeSignal(ctx);
  const minProfit = args.config.minProfitPctForSmartExit;

  if (profitPct < minProfit) {
    return {
      close: false,
      reason: "smart_exit_profit_below_min",
      signal,
      profitPct,
    };
  }

  const reversal =
    args.positionSide === "SHORT"
      ? signalAllowsLong(signal, args.config.minReversalScore)
      : signalAllowsShort(signal, args.config.minReversalScore);

  if (!reversal) {
    return {
      close: false,
      reason: "smart_exit_no_reversal",
      signal,
      profitPct,
    };
  }

  return { close: true, signal, profitPct };
}

export function smartExitSummary(signal: TradeSignal, profitPct: number): string {
  return `${signalSummary(signal)} · PnL ${profitPct.toFixed(2)}%`;
}
