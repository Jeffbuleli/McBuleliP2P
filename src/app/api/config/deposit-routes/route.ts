import { NextResponse } from "next/server";
import { hasBinanceKeys } from "@/lib/env";
import {
  fetchPlatformBinanceApiRestrictions,
  probePlatformBinanceSpot,
} from "@/lib/binance";
import {
  binanceWalletApiBase,
  binanceWalletEnvironment,
  binanceWalletPortalLabel,
} from "@/lib/binance-wallet-config";
import { isPiManualDepositEnabled } from "@/lib/pi-receive-address";

/** Which on-ramp flows are configured server-side. */
export async function GET() {
  const usdtBinance = hasBinanceKeys();
  const piManual = await isPiManualDepositEnabled();
  const binanceEnv = usdtBinance ? binanceWalletEnvironment() : null;

  let binanceSpotOk: boolean | null = null;
  let binanceEnableWithdrawals: boolean | null = null;
  let binanceEnableReading: boolean | null = null;
  let binanceIpRestrict: boolean | null = null;

  if (usdtBinance) {
    binanceSpotOk = await probePlatformBinanceSpot();
    const restrictions = await fetchPlatformBinanceApiRestrictions();
    if (restrictions) {
      binanceEnableWithdrawals = restrictions.enableWithdrawals;
      binanceEnableReading = restrictions.enableReading;
      binanceIpRestrict = restrictions.ipRestrict;
    }
  }

  return NextResponse.json({
    usdtBinance,
    piManual,
    binanceEnv,
    binancePortal: binanceEnv ? binanceWalletPortalLabel(binanceEnv) : null,
    binanceApiBase: usdtBinance ? binanceWalletApiBase() : null,
    binanceSpotOk,
    binanceEnableWithdrawals,
    binanceEnableReading,
    binanceIpRestrict,
    /** @deprecated use usdtBinance */
    enabled: usdtBinance || piManual,
  });
}
