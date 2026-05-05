import type { Messages } from "@/i18n/messages";

export function clientErrorText(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  key: string,
): string {
  if (
    key.startsWith("wallet_") ||
    key.startsWith("staking_") ||
    key.startsWith("p2p_") ||
    key.startsWith("lp_pool_") ||
    key.startsWith("pool_")
  ) {
    return t(key as keyof Messages);
  }
  return key;
}

