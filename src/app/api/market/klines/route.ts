import { NextResponse } from "next/server";
import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";

export const dynamic = "force-dynamic";

const RANGE_MAP = {
  "1h": { interval: "1m", limit: 60 },
  "24h": { interval: "1h", limit: 24 },
  "7d": { interval: "4h", limit: 42 },
} as const;

const FAPI_RANGE_MAP = RANGE_MAP;

const BINANCE_FAPI = "https://fapi.binance.com";

/** OKX public candles — Pi trades as PI-USDT on OKX, not Binance spot. */
const OKX_PI_INST = "PI-USDT";
const PI_CHART_SYMBOL = "PIUSDT";

const OKX_RANGE_MAP = {
  "1h": { bar: "1m", limit: 60 },
  "24h": { bar: "1H", limit: 24 },
  "7d": { bar: "4H", limit: 42 },
} as const;

export type ChartRange = keyof typeof RANGE_MAP;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "BTCUSDT").toUpperCase();
  const rangeRaw = url.searchParams.get("range") ?? "24h";
  const range =
    rangeRaw in RANGE_MAP ? (rangeRaw as ChartRange) : ("24h" as ChartRange);
  const feed = url.searchParams.get("feed") === "futures" ? "futures" : "spot";

  if (symbol === PI_CHART_SYMBOL) {
    return okxPiKlines(range);
  }

  const { interval, limit } =
    feed === "futures" ? FAPI_RANGE_MAP[range] : RANGE_MAP[range];

  const qs = new URLSearchParams({
    symbol,
    interval,
    limit: String(limit),
  });

  try {
    const klineBase =
      feed === "futures"
        ? `${BINANCE_FAPI}/fapi/v1/klines`
        : `${BINANCE_API_PUBLIC}/api/v3/klines`;
    const res = await fetch(`${klineBase}?${qs}`, {
      ...binancePublicFetchInit,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { message: "Market data unavailable." },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as unknown[];
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { message: "Invalid response." },
        { status: 502 },
      );
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
      return NextResponse.json(
        { message: "Not enough data." },
        { status: 502 },
      );
    }

    const first = points[0].p;
    const last = points[points.length - 1].p;
    const changePct =
      first !== 0 ? ((last - first) / first) * 100 : 0;

    return NextResponse.json(
      {
        symbol,
        range,
        points,
        lastPrice: last,
        changePct,
        priceSource: feed === "futures" ? "binance_futures" : "binance_spot",
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Network error." },
      { status: 502 },
    );
  }
}

async function okxPiKlines(range: ChartRange) {
  const { bar, limit } = OKX_RANGE_MAP[range];
  const qs = new URLSearchParams({
    instId: OKX_PI_INST,
    bar,
    limit: String(limit),
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
      return NextResponse.json(
        { message: "Market data unavailable." },
        { status: 502 },
      );
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

    if (points.length < 2) {
      return NextResponse.json(
        { message: "Not enough data." },
        { status: 502 },
      );
    }

    const first = points[0].p;
    const last = points[points.length - 1].p;
    const changePct =
      first !== 0 ? ((last - first) / first) * 100 : 0;

    return NextResponse.json(
      {
        symbol: PI_CHART_SYMBOL,
        range,
        points,
        lastPrice: last,
        changePct,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Network error." },
      { status: 502 },
    );
  }
}
