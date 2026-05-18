import { NextResponse } from "next/server";
import { hasBinanceKeys } from "@/lib/env";
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
  return NextResponse.json({
    usdtBinance,
    piManual,
    binanceEnv,
    binancePortal: binanceEnv ? binanceWalletPortalLabel(binanceEnv) : null,
    binanceApiBase: usdtBinance ? binanceWalletApiBase() : null,
    /** @deprecated use usdtBinance */
    enabled: usdtBinance || piManual,
  });
}
