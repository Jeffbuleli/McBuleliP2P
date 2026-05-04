import { NextResponse } from "next/server";
import {
  BINANCE_API_PUBLIC,
  binancePublicFetchInit,
} from "@/lib/binance-public";

export const dynamic = "force-dynamic";

const TF_MAP = {
  "1m": { interval: "1m", limit: 180 },
  "5m": { interval: "5m", limit: 288 },
  "1h": { interval: "1h", limit: 168 },
  "1d": { interval: "1d", limit: 120 },
} as const;

export type TradeTf = keyof typeof TF_MAP;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "BTCUSDT").toUpperCase();
  const tfRaw = url.searchParams.get("tf") ?? "1h";
  const tf = tfRaw in TF_MAP ? (tfRaw as TradeTf) : ("1h" as TradeTf);
  const { interval, limit } = TF_MAP[tf];

  const qs = new URLSearchParams({
    symbol,
    interval,
    limit: String(limit),
  });

  try {
    const res = await fetch(
      `${BINANCE_API_PUBLIC}/api/v3/klines?${qs}`,
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
      { symbol, tf, points, lastPrice: last, changePct },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ message: "Network error." }, { status: 502 });
  }
}
