import type { Messages } from "@/i18n/messages";

const I18N_PREFIXES = [
  "wallet_",
  "staking_",
  "p2p_",
  "deposit_",
  "wallet_binance_",
  "lp_pool_",
  "pool_",
  "loan_",
  "loans_",
  "group_",
  "admin_",
  "profile_",
  "trade_",
  "member_",
  "avatar_",
  "avec_",
] as const;

const PLAIN_MESSAGE_MAP: Record<string, keyof Messages> = {
  Unauthorized: "group_session_required",
  Forbidden: "group_forbidden",
  "Not found": "group_not_found",
};

/** Map API error keys to i18n — never show raw DB / snake_case codes in UI. */
export function clientErrorText(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  key: string,
  fallback: keyof Messages = "group_action_failed",
): string {
  if (!key || key === "…") return t(fallback);
  const mapped = PLAIN_MESSAGE_MAP[key];
  if (mapped) return t(mapped);
  if (I18N_PREFIXES.some((p) => key.startsWith(p))) {
    return t(key as keyof Messages);
  }
  return t(fallback);
}

