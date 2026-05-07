import { NextResponse } from "next/server";
import { hasBinanceKeys, hasOkxKeys } from "@/lib/env";
import { getPlatformSetting, PlatformSettingKey } from "@/lib/platform-settings";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  const manualPi = await getPlatformSetting(PlatformSettingKey.PI_RECEIVE_ADDRESS_REAL);
  const piManual = Boolean(manualPi?.trim());
  return NextResponse.json({
    usdtBinance: hasBinanceKeys(),
    piOkx: hasOkxKeys(),
    piManual,
    /** @deprecated use usdtBinance */
    enabled: hasBinanceKeys(),
  });
}
