import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";
import {
  binanceUsdtSymbolToOkxInstId,
  fetchOkxSpotTicker,
} from "@/lib/okx-public";

export type MarketTicker = {
  symbol: string;
  lastPrice: string;
  changePct: number;
  /** Price feed — OKX preferred; Binance when reachable. */
  source?: "binance" | "okx";
};

/** Liquid USDT majors (OKX spot + Binance fallback). */
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

const PI_TICKER_SYMBOL = "PIUSDT";

async function fetchOkxUsdtTickers(
  symbols: readonly string[],
): Promise<MarketTicker[]> {
  const settled = await Promise.all(
    symbols.map(async (symbol) => {
      const instId = binanceUsdtSymbolToOkxInstId(symbol);
      if (!instId) return null;
      const t = await fetchOkxSpotTicker(instId);
      if (!t) return null;
      const row: MarketTicker = {
        symbol,
        lastPrice: String(t.last),
        changePct: t.changePct24h,
        source: "okx",
      };
      return row;
    }),
  );
  const out: MarketTicker[] = [];
  for (const row of settled) {
    if (row) out.push(row);
  }
  return out;
}

async function fetchBinanceTickers(): Promise<MarketTicker[] | null> {
  const symbols = [...MARKET_PREVIEW_SYMBOLS];
  const encoded = encodeURIComponent(JSON.stringify(symbols));

  try {
    const res = await fetch(
      `${BINANCE_API_PUBLIC}/api/v3/ticker/24hr?symbols=${encoded}`,
      {
        ...binancePublicFetchInit,
        signal: AbortSignal.timeout(12_000),
      },
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
      source: "binance" as const,
    }));
  } catch {
    return null;
  }
}

/** BTC, ETH, Pi, then other majors. Prefer OKX rows when present. */
function mergeTickers(preferred: MarketTicker[], fallback: MarketTicker[] | null): MarketTicker[] {
  const bySym = new Map<string, MarketTicker>();
  for (const t of fallback ?? []) bySym.set(t.symbol, t);
  for (const t of preferred) bySym.set(t.symbol, t);

  const head: MarketTicker[] = [];
  for (const sym of ["BTCUSDT", "ETHUSDT", PI_TICKER_SYMBOL] as const) {
    const row = bySym.get(sym);
    if (row) {
      head.push(row);
      bySym.delete(sym);
    }
  }
  for (const sym of MARKET_PREVIEW_SYMBOLS) {
    const row = bySym.get(sym);
    if (row) {
      head.push(row);
      bySym.delete(sym);
    }
  }
  for (const t of bySym.values()) head.push(t);
  return head;
}

export async function fetchMarketTickers(): Promise<MarketTicker[] | null> {
  const okxSymbols = [...MARKET_PREVIEW_SYMBOLS, PI_TICKER_SYMBOL];
  const [okx, binance] = await Promise.all([
    fetchOkxUsdtTickers(okxSymbols),
    fetchBinanceTickers(),
  ]);
  if (!okx.length && !binance?.length) return null;
  return mergeTickers(okx, binance);
}
