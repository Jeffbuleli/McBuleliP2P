import type { WalletAsset } from "@/lib/wallet-types";

/** Crypto assets shown on wallet hub (extend when adding BTC, etc.). */
export const WALLET_CRYPTO_ASSETS = ["USDT", "PI"] as const satisfies readonly WalletAsset[];

export type WalletCryptoAsset = (typeof WALLET_CRYPTO_ASSETS)[number];

export function isWalletCryptoAsset(s: string): s is WalletCryptoAsset {
  return (WALLET_CRYPTO_ASSETS as readonly string[]).includes(s);
}

export const CRYPTO_ASSET_ICON: Record<WalletCryptoAsset, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export const CRYPTO_ASSET_NETWORK_LABEL: Partial<Record<WalletCryptoAsset, string>> = {
  USDT: "TRC20 · ERC20 · BEP20",
  PI: "Pi Network",
};
