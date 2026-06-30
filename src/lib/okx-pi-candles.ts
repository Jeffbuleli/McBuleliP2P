/**
 * OKX public REST — PI-USDT candles (reference chart; aligns with McBuleli market PI chart).
 * Docs: GET /api/v5/market/candles
 */
export const OKX_PI_USDT_INST_ID = "PI-USDT";

export async function getOkxPiUsdtCandleSeries(params: {
  bar: string;
  limit: number;
}): Promise<{
  points: { t: number; p: number }[];
  lastPrice: number;
  changePct: number;
} | null> {
  const lim = Math.min(Math.max(1, Math.floor(params.limit)), 300);
  const qs = new URLSearchParams({
    instId: OKX_PI_USDT_INST_ID,
    bar: params.bar,
    limit: String(lim),
  });

  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/market/candles?${qs}`,
      { cache: "no-store", signal: AbortSignal.timeout(15_000) },
    );
    const json = (await res.json()) as {
      code?: string;
      data?: string[][];
      msg?: string;
    };
    if (!res.ok || json.code !== "0" || !Array.isArray(json.data)) {
      return null;
    }

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
    const changePct =
      first !== 0 ? ((last - first) / first) * 100 : 0;

    return { points, lastPrice: last, changePct };
  } catch {
    return null;
  }
}
