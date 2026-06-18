import type { WalletAsset } from "@/lib/wallet-types";

export const WALLET_FIAT_ASSETS = ["USD", "CDF"] as const satisfies readonly WalletAsset[];

export type WalletFiatAsset = (typeof WALLET_FIAT_ASSETS)[number];

export function isWalletFiatAsset(s: string): s is WalletFiatAsset {
  return (WALLET_FIAT_ASSETS as readonly string[]).includes(s);
}

export const FIAT_ASSET_LABEL: Record<WalletFiatAsset, { en: string; fr: string }> = {
  USD: { en: "US Dollar", fr: "Dollar US" },
  CDF: { en: "Congolese franc", fr: "Franc congolais" },
};
