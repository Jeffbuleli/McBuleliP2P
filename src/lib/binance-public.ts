export const BINANCE_API_PUBLIC = "https://api.binance.com";

/**
 * Binance public market-data mirror (same spot 24h feed).
 * Use when api.binance.com returns geo-restriction errors (common in some regions).
 * @see https://github.com/binance/binance-public-data
 */
export const BINANCE_MARKET_DATA_API = "https://data-api.binance.vision";

/** Order: primary API, then public data mirror. */
export const BINANCE_PUBLIC_MARKET_BASES = [
  BINANCE_API_PUBLIC,
  BINANCE_MARKET_DATA_API,
] as const;

/** Next.js / Node fetch: always bypass data cache for live quotes. */
export const binancePublicFetchInit: RequestInit = { cache: "no-store" };

const DEFAULT_TIMEOUT_MS = 12_000;

/** Fetch a Binance public REST path; tries each market base until a JSON array is returned. */
export async function fetchBinancePublicJson(
  path: string,
  init?: RequestInit,
): Promise<unknown[] | null> {
  const signal = init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);

  for (const base of BINANCE_PUBLIC_MARKET_BASES) {
    try {
      const res = await fetch(`${base}${path}`, {
        ...binancePublicFetchInit,
        ...init,
        signal,
      });
      if (!res.ok) continue;
      const data: unknown = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    } catch {
      /* try next base */
    }
  }
  return null;
}
