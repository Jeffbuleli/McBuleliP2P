import { NextResponse } from "next/server";
import { hasBinanceKeys, hasOkxKeys } from "@/lib/env";

/**
 * Tells the UI which deposit paths are configured (no secrets exposed).
 * Route A = internal Binance integration, Route B = internal OKX integration.
 */
export async function GET() {
  return NextResponse.json({
    routeA: hasBinanceKeys(),
    routeB: hasOkxKeys(),
  });
}
