import type { Messages } from "@/i18n/messages";
import type { BotPlanId } from "@/lib/bot-config";

export const BOT_PLAN_DESC_KEY: Record<BotPlanId, keyof Messages> = {
  dca_spot: "bots_plan_dca_desc",
  grid_spot: "bots_plan_grid_desc",
  futures_um: "bots_plan_futures_desc",
};

const LOG_ACTION_I18N: Record<string, keyof Messages> = {
  dca_buy: "bots_log_dca_buy",
  grid_refresh: "bots_log_grid_refresh",
  futures_open: "bots_log_futures_open",
  futures_sl_close: "bots_log_futures_sl_close",
  futures_tp_close: "bots_log_futures_tp_close",
  futures_smart_close: "bots_log_futures_smart_close",
  futures_breakeven_armed: "bots_log_futures_breakeven_armed",
  futures_trailing_close: "bots_log_futures_trailing_close",
  smart_exit_hold: "bots_log_smart_exit_hold",
  error: "bots_log_failed",
  smart_skip: "bots_log_smart_skip",
  tick_skip: "bots_log_tick_skip",
};

const TICK_SKIP_I18N: Record<string, keyof Messages> = {
  no_active_subscription: "bots_skip_no_subscription",
  invalid_config: "bots_skip_invalid_config",
  no_keys: "bots_skip_no_keys",
  amount_too_small: "bots_err_amount_small",
  smart_blocked: "bots_log_smart_skip",
  price_unavailable: "bots_err_price_feed",
  price_out_of_range: "bots_err_price_range",
  order_failed: "bots_log_failed",
  unknown_plan: "bots_skip_unknown_plan",
  exception: "bots_skip_exception",
  position_open: "bots_skip_position_open",
  other_symbol_open: "bots_skip_other_symbol_open",
  futures_failed: "bots_log_failed",
};

export function botTickSkipLabel(
  t: (k: keyof Messages) => string,
  reason: string | undefined,
): string {
  if (!reason) return t("bots_log_tick_skip");
  const key = TICK_SKIP_I18N[reason];
  return key ? t(key) : `${t("bots_log_tick_skip")} (${reason})`;
}

const SMART_ERROR_I18N: Record<string, keyof Messages> = {
  smart_market_data_unavailable: "bots_smart_data_unavailable",
  smart_signal_blocks_long: "bots_smart_blocks_long",
  smart_signal_blocks_short: "bots_smart_blocks_short",
  smart_signal_blocks_buy: "bots_smart_blocks_buy",
  smart_mtf_blocks_long: "bots_smart_mtf_blocks_long",
  smart_mtf_blocks_short: "bots_smart_mtf_blocks_short",
  smart_mtf_blocks_buy: "bots_smart_mtf_blocks_buy",
  bots_positions_fetch_failed: "bots_positions_fetch_failed",
};

export type BotsCredentialStatus = {
  spotOk: boolean;
  futuresOk: boolean;
  futuresApiKind?: "fapi" | "papi" | null;
  validatedAt?: string | null;
};

/** Spot / Futures line for keys hub and wizard success. */
export function formatBotsCredentialValidationLine(
  cred: BotsCredentialStatus | null | undefined,
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string,
): string {
  if (!cred?.validatedAt) return "";
  const spot = cred.spotOk ? t("bots_keys_validated_yes") : t("bots_keys_validated_no");
  let futures = t("bots_keys_validated_no");
  if (cred.futuresOk) {
    futures =
      cred.futuresApiKind === "papi"
        ? t("bots_keys_validated_pm")
        : t("bots_keys_validated_yes");
  }
  return t("bots_keys_validated_detail", { spot, futures });
}

export function botsApiMessage(
  code: string,
  t: (k: keyof Messages) => string,
): string {
  const trimmed = code?.trim();
  if (!trimmed) return t("bots_err_generic");
  if (
    trimmed.startsWith("bots_") ||
    trimmed.startsWith("smart_")
  ) {
    const msg = t(trimmed as keyof Messages);
    if (msg && msg !== trimmed) return msg;
  }
  return formatBotRuntimeError(trimmed, t);
}

const SERVER_ERROR_I18N: Record<string, keyof Messages> = {
  bots_credentials_load_failed: "bots_credentials_load_failed",
  "API keys not connected": "bots_err_no_keys",
  "Invalid DCA config": "bots_invalid_dca_config",
  "Invalid grid config": "bots_invalid_grid_config",
  "Invalid futures config": "bots_invalid_futures_config",
  "quoteAmountUsdt too small": "bots_err_amount_small",
  "quotePerGrid too small": "bots_err_amount_small",
  "marginUsdt too small (min 10)": "bots_err_margin_small",
  "Could not fetch spot price": "bots_err_price_feed",
  "Could not fetch futures mark price": "bots_err_price_feed",
};

export type BotLogRow = {
  id: string;
  planId: string;
  action: string;
  detail?: Record<string, unknown> | null;
  createdAt: string;
};

export function botLogActionLabel(
  t: (k: keyof Messages) => string,
  action: string,
): string {
  const key = LOG_ACTION_I18N[action];
  return key ? t(key) : t("bots_log_other");
}

/** User-facing text for lastError or log detail — never raw Binance JSON. */
export function formatBotRuntimeError(
  raw: string | null | undefined,
  t: (k: keyof Messages) => string,
): string {
  if (!raw?.trim()) return t("bots_err_generic");

  const s = raw.trim();
  if (s.startsWith("smart_") || s.startsWith("bots_positions_")) {
    const mapped = SMART_ERROR_I18N[s];
    if (mapped) return t(mapped);
  }
  if (s.startsWith("bots_")) {
    return t(s as keyof Messages);
  }

  const exact = SERVER_ERROR_I18N[s];
  if (exact) return t(exact);

  const lower = s.toLowerCase();
  const codeMatch = s.match(/"code":\s*(-?\d+)/);
  if (codeMatch) {
    const code = codeMatch[1];
    if (code === "-2015") return t("bots_err_bad_keys");
    if (code === "-2019") return t("bots_err_insufficient_balance");
    if (code === "-1013") return t("bots_err_min_notional");
    if (code === "-1111") return t("bots_err_qty_precision");
  }
  if (lower.includes("outside grid range")) return t("bots_err_price_range");
  if (lower.includes("api keys not connected")) return t("bots_err_no_keys");
  if (lower.includes("could not fetch")) return t("bots_err_price_feed");
  if (lower.includes("too small")) return t("bots_err_amount_small");
  if (
    lower.includes("insufficient") ||
    lower.includes("-2019") ||
    lower.includes("balance")
  ) {
    return t("bots_err_insufficient_balance");
  }
  if (lower.includes("-2015") || lower.includes("invalid api-key")) {
    return t("bots_err_bad_keys");
  }
  if (
    lower.includes("min notional") ||
    lower.includes("-1013") ||
    lower.includes("notional")
  ) {
    return t("bots_err_min_notional");
  }
  if (lower.includes("precision") || lower.includes("-1111")) {
    return t("bots_err_qty_precision");
  }
  if (lower.includes("ip") && lower.includes("restrict")) {
    return t("bots_error_ip_restrict");
  }
  if (s.includes("HTTP") || s.includes("{") || s.length > 80) {
    return t("bots_err_binance_order");
  }

  return t("bots_err_generic");
}

export function botLogDetailMessage(
  log: BotLogRow,
  t: (k: keyof Messages) => string,
): string | null {
  if (log.action === "error") {
    const msg =
      typeof log.detail?.message === "string" ? log.detail.message : null;
    return formatBotRuntimeError(msg, t);
  }
  if (log.action === "smart_skip") {
    const reason =
      typeof log.detail?.reason === "string" ? log.detail.reason : null;
    const score = log.detail?.score;
    const base = reason ? formatBotRuntimeError(reason, t) : t("bots_log_smart_skip");
    if (typeof score === "number") {
      return `${base} (score ${score})`;
    }
    return base;
  }
  if (log.action === "smart_exit_hold") {
    const reason =
      typeof log.detail?.reason === "string" ? log.detail.reason : null;
    return reason ? formatBotRuntimeError(reason, t) : null;
  }
  return null;
}
