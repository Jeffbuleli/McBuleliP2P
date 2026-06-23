export type WalletMoneyMode = "deposit" | "withdraw";
export type WalletMoneyCryptoAsset = "USDT" | "PI";
export type WalletMoneyFiatAsset = "USD" | "CDF";

const CRYPTO_DEPOSIT_BASE = "/app/wallet/deposit";
const CRYPTO_WITHDRAW_BASE = "/app/wallet/withdraw";

export function cryptoDepositHref(asset: WalletMoneyCryptoAsset): string {
  return `${CRYPTO_DEPOSIT_BASE}?asset=${asset}`;
}

export function cryptoDepositDetailHref(depositId: string): string {
  return `${CRYPTO_DEPOSIT_BASE}/${depositId}`;
}

export function cryptoWithdrawHref(asset: WalletMoneyCryptoAsset): string {
  return `${CRYPTO_WITHDRAW_BASE}?asset=${asset}`;
}

export function fiatDepositHref(
  asset?: WalletMoneyFiatAsset,
  rail: "momo" | "card" = "momo",
): string {
  const base =
    rail === "card" ? "/app/wallet/fiat/card/deposit" : "/app/wallet/fiat/deposit";
  if (!asset) return base;
  return `${base}?asset=${asset}`;
}

export function fiatWithdrawHref(asset?: WalletMoneyFiatAsset): string {
  if (!asset) return "/app/wallet/fiat/withdraw";
  return `/app/wallet/fiat/withdraw?asset=${asset}`;
}