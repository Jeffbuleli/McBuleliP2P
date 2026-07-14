import { BINANCE_API_PUBLIC, binancePublicFetchInit } from "@/lib/binance-public";
import { fetchOkxTickerForBinanceSymbol } from "@/lib/okx-public";

export type SymbolTicker = {
  symbol: string;
  lastPrice: number;
  changePct24h: number;
  /** When true, the returned price is from a recent cached snapshot. */
  stale?: boolean;
  /** Price source: OKX preferred; Binance when reachable; else cache. */
  source?: "binance_spot" | "binance_futures" | "okx" | "cache";
};

type CacheEntry = {
  ts: number;
  lastPrice: number;
  changePct24h: number;
  source: SymbolTicker["source"];
};

function priceCacheMap(): Map<string, CacheEntry> {
  const g = globalThis as unknown as {
    __mcbuleli_trade_price_cache?: Map<string, CacheEntry>;
  };
  if (!g.__mcbuleli_trade_price_cache) {
    g.__mcbuleli_trade_price_cache = new Map();
  }
  return g.__mcbuleli_trade_price_cache;
}

function rejectsJump(
  prev: CacheEntry | undefined,
  lastPrice: number,
  now: number,
): boolean {
  if (!prev) return false;
  const dt = now - prev.ts;
  if (dt <= 0 || dt > 15_000) return false;
  const pct = Math.abs((lastPrice - prev.lastPrice) / prev.lastPrice);
  return Number.isFinite(pct) && pct > 0.15;
}

function storeAndReturn(
  priceCache: Map<string, CacheEntry>,
  now: number,
  out: SymbolTicker,
): SymbolTicker {
  priceCache.set(out.symbol, {
    ts: now,
    lastPrice: out.lastPrice,
    changePct24h: out.changePct24h,
    source: out.source,
  });
  return out;
}

export async function fetchSymbolTicker(symbol: string): Promise<SymbolTicker | null> {
  const sym = symbol.toUpperCase();
  const now = Date.now();
  const priceCache = priceCacheMap();
  const prev = priceCache.get(sym);

  // 1) OKX spot first (Binance.com geo-blocks many VPS regions, e.g. US).
  const okx = await fetchOkxTickerForBinanceSymbol(sym);
  if (okx && !rejectsJump(prev, okx.last, now)) {
    return storeAndReturn(priceCache, now, {
      symbol: sym,
      lastPrice: okx.last,
      changePct24h: okx.changePct24h,
      source: "okx",
    });
  }

  try {
    // 2) Binance futures mark (when IP is allowed).
    const fapi = "https://fapi.binance.com";
    const [markRes, fut24Res] = await Promise.all([
      fetch(
        `${fapi}/fapi/v1/premiumIndex?symbol=${encodeURIComponent(sym)}`,
        binancePublicFetchInit,
      ),
      fetch(
        `${fapi}/fapi/v1/ticker/24hr?symbol=${encodeURIComponent(sym)}`,
        binancePublicFetchInit,
      ),
    ]);

    if (!markRes.ok || !fut24Res.ok) {
      throw new Error("feed_unavailable");
    }

    const markData = (await markRes.json()) as {
      symbol: string;
      markPrice: string;
      time: number;
    };
    const fut24 = (await fut24Res.json()) as {
      symbol: string;
      priceChangePercent: string;
    };

    const lastPrice = Number(markData.markPrice);
    const changePct24h = Number(fut24.priceChangePercent);
    const ageMs = typeof markData.time === "number" ? now - markData.time : 0;
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) throw new Error("bad_price");
    if (Number.isFinite(ageMs) && ageMs > 30_000) throw new Error("stale_price");
    if (rejectsJump(prev, lastPrice, now)) throw new Error("price_jump");

    return storeAndReturn(priceCache, now, {
      symbol: markData.symbol ?? sym,
      lastPrice,
      changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
      source: "binance_futures",
    });
  } catch {
    try {
      const res = await fetch(
        `${BINANCE_API_PUBLIC}/api/v3/ticker/24hr?symbol=${encodeURIComponent(sym)}`,
        binancePublicFetchInit,
      );
      if (!res.ok) throw new Error("spot_unavailable");
      const data = (await res.json()) as {
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
      };
      const lastPrice = Number(data.lastPrice);
      const changePct24h = Number(data.priceChangePercent);
      if (!Number.isFinite(lastPrice) || lastPrice <= 0) throw new Error("bad_spot");

      return storeAndReturn(priceCache, now, {
        symbol: data.symbol ?? sym,
        lastPrice,
        changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
        source: "binance_spot",
      });
    } catch {
      if (prev && now - prev.ts <= 60_000) {
        return {
          symbol: sym,
          lastPrice: prev.lastPrice,
          changePct24h: prev.changePct24h,
          stale: true,
          source: "cache",
        };
      }
      return null;
    }
  }
}
