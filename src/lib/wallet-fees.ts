import type { WalletAsset } from "@/lib/wallet-types";

/** Mobile money fiat deposit / withdrawal - platform fee (shown to user). */
export const FIAT_FEE_RATE = 0.05;

/** USDT ↔ USD/CDF and other standard pairs. */
export const SWAP_FEE_RATE_STANDARD = 0.01;

/** Fiat (USD/CDF) → crypto (USDT/PI). */
export const SWAP_FEE_RATE_FIAT_TO_CRYPTO = 0.025;

const FIAT_ASSETS = new Set<WalletAsset>(["USD", "CDF"]);
const CRYPTO_ASSETS = new Set<WalletAsset>(["USDT", "PI"]);

export function swapFeeRate(from: WalletAsset, to: WalletAsset): number {
  if (FIAT_ASSETS.has(from) && CRYPTO_ASSETS.has(to)) {
    return SWAP_FEE_RATE_FIAT_TO_CRYPTO;
  }
  return SWAP_FEE_RATE_STANDARD;
}

export function swapFeePercentLabel(from: WalletAsset, to: WalletAsset): number {
  return Math.round(swapFeeRate(from, to) * 1000) / 10;
}

/** Minimum gross USD notional for a swap (fee must leave something to convert). */
export function swapMinGrossUsd(from: WalletAsset, to: WalletAsset): number {
  const rate = swapFeeRate(from, to);
  return Math.max(0.5, 1 / rate / 100);
}
