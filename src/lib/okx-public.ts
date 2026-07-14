/**
 * OKX public market data (no API key).
 * Prefer over Binance when the server IP is geo-restricted (e.g. US → HTTP 451).
 */

export const OKX_PUBLIC_API = "https://www.okx.com";

/** BTCUSDT → BTC-USDT ; PIUSDT → PI-USDT */
export function binanceUsdtSymbolToOkxInstId(symbol: string): string | null {
  const sym = symbol.trim().toUpperCase();
  if (!sym.endsWith("USDT") || sym.length <= 4) return null;
  const base = sym.slice(0, -4);
  if (!base) return null;
  return `${base}-USDT`;
}

export type OkxPublicTicker = {
  instId: string;
  last: number;
  open24h: number;
  changePct24h: number;
};

export async function fetchOkxSpotTicker(
  instId: string,
): Promise<OkxPublicTicker | null> {
  try {
    const res = await fetch(
      `${OKX_PUBLIC_API}/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`,
      { cache: "no-store", signal: AbortSignal.timeout(12_000) },
    );
    const json = (await res.json()) as {
      code?: string;
      data?: Array<{ last?: string; open24h?: string; instId?: string }>;
    };
    if (!res.ok || json.code !== "0" || !json.data?.[0]?.last) return null;
    const row = json.data[0];
    const last = Number(row.last);
    const open24h = Number(row.open24h);
    if (!Number.isFinite(last) || last <= 0) return null;
    const changePct24h =
      Number.isFinite(open24h) && open24h > 0
        ? ((last - open24h) / open24h) * 100
        : 0;
    return {
      instId: row.instId ?? instId,
      last,
      open24h: Number.isFinite(open24h) ? open24h : 0,
      changePct24h,
    };
  } catch {
    return null;
  }
}

/** Resolve Binance-style SYMBOLUSDT via OKX spot. */
export async function fetchOkxTickerForBinanceSymbol(
  symbol: string,
): Promise<OkxPublicTicker | null> {
  const instId = binanceUsdtSymbolToOkxInstId(symbol);
  if (!instId) return null;
  return fetchOkxSpotTicker(instId);
}

export async function fetchOkxSpotCandleSeries(params: {
  instId: string;
  bar: string;
  limit: number;
}): Promise<{
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
} | null> {
  const lim = Math.min(Math.max(1, Math.floor(params.limit)), 300);
  const qs = new URLSearchParams({
    instId: params.instId,
    bar: params.bar,
    limit: String(lim),
  });
  try {
    const res = await fetch(
      `${OKX_PUBLIC_API}/api/v5/market/candles?${qs}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) },
    );
    const json = (await res.json()) as {
      code?: string;
      data?: string[][];
    };
    if (!res.ok || json.code !== "0" || !Array.isArray(json.data)) return null;

    const points: { t: number; p: number }[] = [];
    for (const row of json.data) {
      if (!Array.isArray(row) || row.length < 5) continue;
      const openTime = Number(row[0]);
      const close = Number(row[4]);
      if (!Number.isFinite(openTime) || !Number.isFinite(close)) continue;
      points.push({ t: openTime, p: close });
    }
    points.sort((a, b) => a.t - b.t);
    if (points.length < 2) return null;

    const first = points[0]!.p;
    const last = points[points.length - 1]!.p;
    const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;
    return { points, lastPrice: last, changePct };
  } catch {
    return null;
  }
}
