/**
 * OKX public REST — PI-USDT candles (reference chart; aligns with McBuleli market PI chart).
 * Docs: GET /api/v5/market/candles
 *
 * Prefer {@link fetchOkxSpotCandleSeries} from `@/lib/okx-public` for any USDT pair.
 */
import { fetchOkxSpotCandleSeries } from "@/lib/okx-public";

export const OKX_PI_USDT_INST_ID = "PI-USDT";

export async function getOkxPiUsdtCandleSeries(params: {
  bar: string;
  limit: number;
}): Promise<{
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
} | null> {
  return fetchOkxSpotCandleSeries({
    instId: OKX_PI_USDT_INST_ID,
    bar: params.bar,
    limit: params.limit,
  });
}
