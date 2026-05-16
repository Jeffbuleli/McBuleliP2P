import { NextResponse } from "next/server";
import { hasBinanceKeys } from "@/lib/env";
import { isPiManualDepositEnabled } from "@/lib/pi-receive-address";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  const usdtBinance = hasBinanceKeys();
  const piManual = await isPiManualDepositEnabled();
  return NextResponse.json({
    usdtBinance,
    piManual,
    /** @deprecated use usdtBinance */
    enabled: usdtBinance || piManual,
  });
}
