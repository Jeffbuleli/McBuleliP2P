import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";

export type MarketTicker = {
  symbol: string;
  lastPrice: string;
  changePct: number;
};

/** Liquid USDT majors on Binance Spot (global book). */
export const MARKET_PREVIEW_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "TRXUSDT",
  "DOTUSDT",
] as const;

export async function fetchMarketTickers(): Promise<MarketTicker[] | null> {
  const symbols = [...MARKET_PREVIEW_SYMBOLS];
  const encoded = encodeURIComponent(JSON.stringify(symbols));

  try {
    const res = await fetch(
      `${BINANCE_API_PUBLIC}/api/v3/ticker/24hr?symbols=${encoded}`,
      binancePublicFetchInit,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    }>;
    if (!Array.isArray(data)) return null;
    return data.map((t) => ({
      symbol: t.symbol,
      lastPrice: t.lastPrice,
      changePct: Number(t.priceChangePercent),
    }));
  } catch {
    return null;
  }
}
