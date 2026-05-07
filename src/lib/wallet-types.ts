export const WALLET_ASSETS = ["USDT", "PI", "PI_TEST", "USD", "CDF"] as const;
export type WalletAsset = (typeof WALLET_ASSETS)[number];

export function isWalletAsset(s: string): s is WalletAsset {
  return (WALLET_ASSETS as readonly string[]).includes(s);
}

export function numFromNumeric(v: string | null | undefined): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function fmtWalletAmount(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(18);
}
