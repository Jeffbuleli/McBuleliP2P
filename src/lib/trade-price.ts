import { BINANCE_API_PUBLIC, binancePublicFetchInit } from "@/lib/binance-public";

export type SymbolTicker = {
  symbol: string;
  lastPrice: number;
  changePct24h: number;
  /** When true, the returned price is from a recent cached snapshot. */
  stale?: boolean;
  /** Price source: spot (binance), futures mark/index, or cache fallback. */
  source?: "binance_spot" | "binance_futures" | "okx" | "cache";
};

export async function fetchSymbolTicker(symbol: string): Promise<SymbolTicker | null> {
  const sym = symbol.toUpperCase();
  const now = Date.now();

  if (sym === "PIUSDT") {
    try {
      const res = await fetch(
        "https://www.okx.com/api/v5/market/ticker?instId=PI-USDT",
        { cache: "no-store", signal: AbortSignal.timeout(12_000) },
      );
      const json = (await res.json()) as {
        code?: string;
        data?: Array<{ last?: string; open24h?: string }>;
      };
      if (res.ok && json.code === "0" && json.data?.[0]?.last) {
        const row = json.data[0];
        const lastPrice = Number(row.last);
        const open24h = Number(row.open24h);
        if (Number.isFinite(lastPrice) && lastPrice > 0) {
          const changePct24h =
            Number.isFinite(open24h) && open24h > 0
              ? ((lastPrice - open24h) / open24h) * 100
              : 0;
          return {
            symbol: sym,
            lastPrice,
            changePct24h,
            source: "okx",
          };
        }
      }
    } catch {
      /* fall through to generic path */
    }
  }

  // In-memory cache: last known safe price per symbol.
  // Safe for serverless/runtime; best-effort fallback for brief feed hiccups.
  const cache = (globalThis as unknown as {
    __mcbuleli_trade_price_cache?: Map<
      string,
      { ts: number; lastPrice: number; changePct24h: number; source: SymbolTicker["source"] }
    >;
  }).__mcbuleli_trade_price_cache;
  const priceCache =
    cache ??
    (((globalThis as unknown as { __mcbuleli_trade_price_cache?: unknown })
      .__mcbuleli_trade_price_cache = new Map()) as Map<
      string,
      { ts: number; lastPrice: number; changePct24h: number; source: SymbolTicker["source"] }
    >);

  const prev = priceCache.get(sym);

  try {
    // 1) Futures mark/index (more appropriate for liquidations than spot lastPrice).
    // We use premiumIndex: returns markPrice + time.
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

    // Staleness: reject stale payloads
    const ageMs = typeof markData.time === "number" ? now - markData.time : 0;
    if (!Number.isFinite(lastPrice) || lastPrice <= 0) throw new Error("bad_price");
    if (Number.isFinite(ageMs) && ageMs > 30_000) throw new Error("stale_price");

    // Circuit breaker: reject sudden jumps over a short window.
    if (prev) {
      const dt = now - prev.ts;
      if (dt > 0 && dt <= 15_000) {
        const pct = Math.abs((lastPrice - prev.lastPrice) / prev.lastPrice);
        if (Number.isFinite(pct) && pct > 0.15) {
          throw new Error("price_jump");
        }
      }
    }

    const out: SymbolTicker = {
      symbol: markData.symbol ?? sym,
      lastPrice,
      changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
      source: "binance_futures",
    };
    priceCache.set(sym, {
      ts: now,
      lastPrice: out.lastPrice,
      changePct24h: out.changePct24h,
      source: out.source,
    });
    return out;
  } catch {
    // 2) Spot fallback (display + best-effort mark) for cases where futures endpoint is unavailable.
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

      const out: SymbolTicker = {
        symbol: data.symbol ?? sym,
        lastPrice,
        changePct24h: Number.isFinite(changePct24h) ? changePct24h : 0,
        source: "binance_spot",
      };
      priceCache.set(sym, {
        ts: now,
        lastPrice: out.lastPrice,
        changePct24h: out.changePct24h,
        source: out.source,
      });
      return out;
    } catch {
      // 3) Cache fallback (brief outage only)
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
