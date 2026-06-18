import { fetchOfficialCdfPerUsd } from "@/lib/cdf-official-rate";
import { okxPublicTickerLast } from "@/lib/okx";

/** Server-side reference prices for conversions (never shown as provider names in UI). */
export type ReferenceRates = {
  usdtUsd: number;
  cdfPerUsd: number;
  piUsd: number;
  cdfSource?: "live" | "cache" | "env";
};

export async function fetchReferenceRates(): Promise<ReferenceRates> {
  const { rate: cdfPerUsd, source: cdfSource } = await fetchOfficialCdfPerUsd();
  let piUsd = 0;
  try {
    const last = await okxPublicTickerLast("PI-USDT");
    const n = last != null ? Number(last) : NaN;
    if (Number.isFinite(n) && n > 0) piUsd = n;
  } catch {
    piUsd = 0;
  }
  return { usdtUsd: 1, cdfPerUsd, piUsd, cdfSource };
}
