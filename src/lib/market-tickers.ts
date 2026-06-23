import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";

export type MarketTicker = {
  symbol: string;
  lastPrice: string;
  changePct: number;
  /** Price feed — Pi uses OKX public ticker; majors use Binance spot. */
  source?: "binance" | "okx";
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

const PI_TICKER_SYMBOL = "PIUSDT";

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

async function fetchOkxPiTicker(): Promise<MarketTicker | null> {
  try {
    const res = await fetch(
      "https://www.okx.com/api/v5/market/ticker?instId=PI-USDT",
      { cache: "no-store", signal: AbortSignal.timeout(12_000) },
    );
    const json = (await res.json()) as {
      code?: string;
      data?: Array<{ last?: string; open24h?: string }>;
    };
    if (!res.ok || json.code !== "0" || !json.data?.[0]?.last) return null;
    const row = json.data[0];
    const lastN = Number(row.last);
    const open24h = Number(row.open24h);
    if (!Number.isFinite(lastN) || lastN <= 0) return null;
    const changePct =
      Number.isFinite(open24h) && open24h > 0
        ? ((lastN - open24h) / open24h) * 100
        : 0;
    return {
      symbol: PI_TICKER_SYMBOL,
      lastPrice: row.last!,
      changePct,
      source: "okx",
    };
  } catch {
    return null;
  }
}

/** BTC, ETH, Pi (OKX), then other Binance majors. */
function mergeTickers(binance: MarketTicker[] | null, pi: MarketTicker | null): MarketTicker[] {
  const rest = (binance ?? []).filter((t) => t.symbol !== PI_TICKER_SYMBOL);
  const head: MarketTicker[] = [];
  for (const sym of ["BTCUSDT", "ETHUSDT"] as const) {
    const row = rest.find((t) => t.symbol === sym);
    if (row) head.push(row);
  }
  if (pi) head.push(pi);
  const used = new Set(head.map((t) => t.symbol));
  for (const t of rest) {
    if (!used.has(t.symbol)) head.push(t);
  }
  return head;
}

export async function fetchMarketTickers(): Promise<MarketTicker[] | null> {
  const [binance, pi] = await Promise.all([fetchBinanceTickers(), fetchOkxPiTicker()]);
  if (!binance?.length && !pi) return null;
  return mergeTickers(binance, pi);
}
