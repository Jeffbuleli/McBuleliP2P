import { NextResponse } from "next/server";
import { fetchMarketTickers } from "@/lib/market-tickers";

/** 24h ticker snapshot - Binance spot (api.binance.com or data-api.binance.vision) + OKX Pi. */
export async function GET() {
  try {
    const tickers = await fetchMarketTickers();
    if (!tickers?.length) {
      return NextResponse.json(
        { message: "Market data unavailable." },
        { status: 502 },
      );
    }
    return NextResponse.json(
      { tickers, fetchedAt: new Date().toISOString() },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=30",
        },
      },
    );
  } catch {
    return NextResponse.json({ message: "Network error." }, { status: 502 });
  }
}
