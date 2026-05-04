import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";

export type SymbolTicker = {
  symbol: string;
  lastPrice: number;
  changePct24h: number;
};

export async function fetchSymbolTicker(symbol: string): Promise<SymbolTicker | null> {
  const sym = symbol.toUpperCase();
  try {
    const res = await fetch(
      `${BINANCE_API_PUBLIC}/api/v3/ticker/24hr?symbol=${encodeURIComponent(sym)}`,
      binancePublicFetchInit,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      symbol: string;
      lastPrice: string;
      priceChangePercent: string;
    };
    const lastPrice = Number(data.lastPrice);
    const changePct24h = Number(data.priceChangePercent);
    if (!Number.isFinite(lastPrice)) return null;
    return {
      symbol: data.symbol,
      lastPrice,
      changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
    };
  } catch {
    return null;
  }
}
