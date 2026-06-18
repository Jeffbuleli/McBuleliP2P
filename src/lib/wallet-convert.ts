import type { ReferenceRates } from "@/lib/reference-rates";
import { swapFeeRate, swapMinGrossUsd } from "@/lib/wallet-fees";
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

export type SwapQuote =
  | {
      ok: true;
      fromAmount: number;
      toAmount: number;
      feeUsd: number;
      feeRate: number;
      grossUsd: number;
      netUsdAfterFee: number;
    }
  | { ok: false; message: string };

export function quoteSwap(args: {
  from: WalletAsset;
  to: WalletAsset;
  fromAmount: number;
  rates: ReferenceRates;
}): SwapQuote {
  const { from, to, fromAmount, rates } = args;
  if (from === to) {
    return { ok: false, message: "wallet_swap_same_asset" };
  }
  if (from === "PI" && rates.piUsd <= 0) {
    return { ok: false, message: "wallet_swap_pi_rate_unavailable" };
  }
  if (to === "PI" && rates.piUsd <= 0) {
    return { ok: false, message: "wallet_swap_pi_rate_unavailable" };
  }
  if (!Number.isFinite(fromAmount) || fromAmount <= 0) {
    return { ok: false, message: "wallet_swap_invalid_amount" };
  }
  const grossUsd = assetAmountToUsd(fromAmount, from, rates);
  const feeRate = swapFeeRate(from, to);
  const minGross = swapMinGrossUsd(from, to);
  if (grossUsd < minGross) {
    return { ok: false, message: "wallet_swap_below_min" };
  }
  const feeUsd = grossUsd * feeRate;
  const netUsdAfterFee = grossUsd - feeUsd;
  if (netUsdAfterFee <= 0) {
    return { ok: false, message: "wallet_swap_below_min" };
  }
  const toAmount = usdToAssetAmount(netUsdAfterFee, to, rates);
  if (!Number.isFinite(toAmount) || toAmount <= 0) {
    return { ok: false, message: "wallet_swap_invalid_amount" };
  }
  return {
    ok: true,
    fromAmount,
    toAmount,
    feeUsd,
    feeRate,
    grossUsd,
    netUsdAfterFee,
  };
}
