import { NextResponse } from "next/server";
import { fetchSymbolTicker } from "@/lib/trade-price";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbol = (url.searchParams.get("symbol") ?? "BTCUSDT").toUpperCase();
  const t = await fetchSymbolTicker(symbol);
  if (!t) {
    return NextResponse.json({ message: "trade_price_unavailable" }, { status: 502 });
  }
  return NextResponse.json(t, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
