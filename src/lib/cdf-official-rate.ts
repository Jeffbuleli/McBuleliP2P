import { cdfPerOneUsd } from "@/lib/fx";

type Cache = { rate: number; at: number; source: string };

let cache: Cache | null = null;
const TTL_MS = 30 * 60 * 1000;

async function tryErApi(): Promise<number | null> {
  const res = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { rates?: Record<string, number> };
  const cdf = json.rates?.CDF;
  return typeof cdf === "number" && cdf > 500 && cdf < 50_000 ? cdf : null;
}

async function tryExchangeRateHost(): Promise<number | null> {
  const res = await fetch("https://api.exchangerate.host/latest?base=USD&symbols=CDF", {
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { rates?: Record<string, number> };
  const cdf = json.rates?.CDF;
  return typeof cdf === "number" && cdf > 500 && cdf < 50_000 ? cdf : null;
}

/** Live USD/CDF reference (market mid) with env fallback. */
export async function fetchOfficialCdfPerUsd(): Promise<{
  rate: number;
  source: "live" | "cache" | "env";
}> {
  if (cache && Date.now() - cache.at < TTL_MS) {
    return { rate: cache.rate, source: "cache" };
  }

  for (const [fn, label] of [
    [tryErApi, "er-api"],
    [tryExchangeRateHost, "exchangerate.host"],
  ] as const) {
    try {
      const rate = await fn();
      if (rate != null) {
        cache = { rate, at: Date.now(), source: label };
        return { rate, source: "live" };
      }
    } catch {
      // try next source
    }
  }

  const fallback = cdfPerOneUsd();
  return { rate: fallback, source: "env" };
}
