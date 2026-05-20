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

export type WalletRailsSnapshot = {
  usdtBinance: boolean;
  piManual: boolean;
  binanceEnv: "demo" | "live" | null;
  binancePortal: string | null;
  binanceApiBase: string | null;
  binanceSpotOk: boolean | null;
  binanceEnableWithdrawals: boolean | null;
  binanceEnableReading: boolean | null;
  binanceIpRestrict: boolean | null;
  /** Keys present but wallet/deposit API not verified (IP, permissions, demo vs live). */
  usdtBinanceNeedsSetup: boolean;
};

export async function getWalletRailsSnapshot(): Promise<WalletRailsSnapshot> {
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

  const usdtBinanceNeedsSetup =
    usdtBinance &&
    (binanceSpotOk === false ||
      binanceEnableWithdrawals === false ||
      binanceEnableReading === false);

  return {
    usdtBinance,
    piManual,
    binanceEnv,
    binancePortal: binanceEnv ? binanceWalletPortalLabel(binanceEnv) : null,
    binanceApiBase: usdtBinance ? binanceWalletApiBase() : null,
    binanceSpotOk,
    binanceEnableWithdrawals,
    binanceEnableReading,
    binanceIpRestrict,
    usdtBinanceNeedsSetup,
  };
}
