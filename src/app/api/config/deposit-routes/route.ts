import { NextResponse } from "next/server";
import { hasBinanceKeys, hasOkxKeys } from "@/lib/env";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  return NextResponse.json({
    usdtBinance: hasBinanceKeys(),
    piOkx: hasOkxKeys(),
    /** @deprecated use usdtBinance */
    enabled: hasBinanceKeys(),
  });
}
