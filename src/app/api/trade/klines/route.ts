import { NextResponse } from "next/server";
import { binancePublicFetchInit } from "@/lib/binance-public";
import {
  binanceUsdtSymbolToOkxInstId,
  fetchOkxSpotCandleSeries,
} from "@/lib/okx-public";

export const dynamic = "force-dynamic";

const BINANCE_FAPI = "https://fapi.binance.com";

const TF_MAP = {
  "1m": { interval: "1m", limit: 180 },
  "5m": { interval: "5m", limit: 288 },
  "15m": { interval: "15m", limit: 192 },
  "30m": { interval: "30m", limit: 168 },
  "1h": { interval: "1h", limit: 168 },
  "4h": { interval: "4h", limit: 120 },
  "1d": { interval: "1d", limit: 120 },
} as const;

/** OKX `bar` values (same spans as Binance limits above). */
const TF_MAP_OKX = {
  "1m": { bar: "1m", limit: 180 },
  "5m": { bar: "5m", limit: 288 },
  "15m": { bar: "15m", limit: 192 },
  "30m": { bar: "30m", limit: 168 },
  "1h": { bar: "1H", limit: 168 },
  "4h": { bar: "4H", limit: 120 },
  "1d": { bar: "1D", limit: 120 },
} as const satisfies Record<keyof typeof TF_MAP, { bar: string; limit: number }>;

export type TradeTf = keyof typeof TF_MAP;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "BTCUSDT").toUpperCase();
  const tfRaw = url.searchParams.get("tf") ?? "1h";
  const tf = tfRaw in TF_MAP ? (tfRaw as TradeTf) : ("1h" as TradeTf);

  // 1) OKX spot candles first (public; works when Binance geo-blocks the VPS).
  const okxInst = binanceUsdtSymbolToOkxInstId(symbol);
  if (okxInst) {
    const { bar, limit } = TF_MAP_OKX[tf];
    const series = await fetchOkxSpotCandleSeries({
      instId: okxInst,
      bar,
      limit,
    });
    if (series) {
      return NextResponse.json(
        {
          symbol,
          tf,
          points: series.points,
          lastPrice: series.lastPrice,
          changePct: series.changePct,
          priceSource: "okx_spot",
        },
        { headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }
  }

  // 2) Binance USDT-M futures klines fallback
  const { interval, limit } = TF_MAP[tf];
  const qs = new URLSearchParams({
    symbol,
    interval,
    limit: String(limit),
  });

  try {
    const res = await fetch(
      `${BINANCE_FAPI}/fapi/v1/klines?${qs}`,
      binancePublicFetchInit,
    );
    if (!res.ok) {
      return NextResponse.json(
        { message: "Market data unavailable." },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as unknown[];
    if (!Array.isArray(raw)) {
      return NextResponse.json({ message: "Invalid response." }, { status: 502 });
    }

    const points: { t: number; p: number }[] = [];
    for (const row of raw) {
      if (!Array.isArray(row) || row.length < 5) continue;
      const openTime = Number(row[0]);
      const close = Number(row[4]);
      if (!Number.isFinite(openTime) || !Number.isFinite(close)) continue;
      points.push({ t: openTime, p: close });
    }

    if (points.length < 2) {
      return NextResponse.json({ message: "Not enough data." }, { status: 502 });
    }

    const first = points[0].p;
    const last = points[points.length - 1].p;
    const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;

    return NextResponse.json(
      {
        symbol,
        tf,
        points,
        lastPrice: last,
        changePct,
        priceSource: "binance_futures",
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ message: "Network error." }, { status: 502 });
  }
}
