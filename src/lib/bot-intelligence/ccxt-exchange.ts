import ccxt, { type Exchange } from "ccxt";
import type { BotEnvironment } from "@/lib/bot-config";
import type { MarketKind, CandleTimeframe } from "@/lib/bot-intelligence/types";

export function binancePairToCcxt(symbol: string, market: MarketKind): string {
  const base = symbol.replace(/USDT$/i, "");
  return market === "futures" ? `${base}/USDT:USDT` : `${base}/USDT`;
}

export function createCcxtMarketExchange(
  environment: BotEnvironment,
  market: MarketKind,
): Exchange {
  if (market === "futures") {
    const ex = new ccxt.binanceusdm({
      enableRateLimit: true,
      options: { defaultType: "future" },
    });
    if (environment === "demo") {
      ex.setSandboxMode(true);
    }
    return ex;
  }
  const ex = new ccxt.binance({ enableRateLimit: true });
  if (environment === "demo") {
    ex.setSandboxMode(true);
  }
  return ex;
}

export function timeframeToCcxt(tf: CandleTimeframe): string {
  return tf;
}
