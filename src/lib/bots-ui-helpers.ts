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
  error: "bots_log_failed",
};

const SERVER_ERROR_I18N: Record<string, keyof Messages> = {
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
  if (s.startsWith("bots_")) {
    const k = s as keyof Messages;
    return t(k);
  }

  const exact = SERVER_ERROR_I18N[s];
  if (exact) return t(exact);

  const lower = s.toLowerCase();
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
  return null;
}
