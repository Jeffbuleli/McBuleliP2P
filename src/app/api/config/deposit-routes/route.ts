import { NextResponse } from "next/server";
import { hasBinanceKeys } from "@/lib/env";

/** Which on-ramp flows are configured server-side (USDT via Binance only). */
export async function GET() {
  return NextResponse.json({
    usdtBinance: hasBinanceKeys(),
    /** @deprecated use usdtBinance */
    enabled: hasBinanceKeys(),
  });
}
