import type { ReferenceRates } from "@/lib/reference-rates";
import type { WalletAsset } from "@/lib/wallet-types";

/** Convert an asset amount to USD notional (reference). */
export function assetAmountToUsd(amount: number, asset: WalletAsset, r: ReferenceRates): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  switch (asset) {
    case "USDT":
      return amount * r.usdtUsd;
    case "USD":
      return amount;
    case "CDF":
      return amount / r.cdfPerUsd;
    case "PI":
      return r.piUsd > 0 ? amount * r.piUsd : 0;
    case "PI_TEST":
      // Training-only; use same reference rate as PI for display.
      return r.piUsd > 0 ? amount * r.piUsd : 0;
    default:
      return 0;
  }
}

/** Convert USD notional to target asset amount (reference). */
export function usdToAssetAmount(usd: number, asset: WalletAsset, r: ReferenceRates): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  switch (asset) {
    case "USDT":
      return usd / r.usdtUsd;
    case "USD":
      return usd;
    case "CDF":
      return usd * r.cdfPerUsd;
    case "PI":
      return r.piUsd > 0 ? usd / r.piUsd : 0;
    case "PI_TEST":
      return r.piUsd > 0 ? usd / r.piUsd : 0;
    default:
      return 0;
  }
}
