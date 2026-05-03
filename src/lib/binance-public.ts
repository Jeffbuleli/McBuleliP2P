export const BINANCE_API_PUBLIC = "https://api.binance.com";

/** Next.js / Node fetch: always bypass data cache for live quotes. */
export const binancePublicFetchInit: RequestInit = { cache: "no-store" };
