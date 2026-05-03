import { NextResponse } from "next/server";
import { fetchMarketTickers } from "@/lib/market-tickers";

export const dynamic = "force-dynamic";

/** 24h ticker snapshot (Binance Spot) — refreshed on each request (live polling from client). */
export async function GET() {
  try {
    const tickers = await fetchMarketTickers();
    if (!tickers) {
      return NextResponse.json(
        { message: "Market data unavailable." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { tickers },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json({ message: "Network error." }, { status: 502 });
  }
}
