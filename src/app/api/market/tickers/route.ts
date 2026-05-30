import { NextResponse } from "next/server";
import { fetchMarketTickers } from "@/lib/market-tickers";

/** 24h ticker snapshot (Binance Spot) — short CDN cache; client polls for live updates. */
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
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch {
    return NextResponse.json({ message: "Network error." }, { status: 502 });
  }
}
