import type { Messages } from "@/i18n/messages";

export function clientErrorText(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  key: string,
): string {
  if (
    key.startsWith("wallet_") ||
    key.startsWith("staking_") ||
    key.startsWith("p2p_") ||
    key.startsWith("deposit_") ||
    key.startsWith("wallet_binance_") ||
    key.startsWith("lp_pool_") ||
    key.startsWith("pool_") ||
    key.startsWith("loan_") ||
    key.startsWith("loans_") ||
    key.startsWith("group_")
  ) {
    return t(key as keyof Messages);
  }
  return key;
}

