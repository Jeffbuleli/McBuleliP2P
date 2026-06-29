import type { Messages } from "@/i18n/messages";
import type { BotPlanId } from "@/lib/bot-config";
import {
  categoryAccent,
  mapLegacySkipToReasonCode,
  type DecisionReasonCode,
} from "@/lib/bot-decision/reason-codes";
import { formatIgnoredLabel } from "@/lib/bot-decision/trace";

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
  futures_max_hold_close: "bots_log_futures_max_hold_close",
  smart_exit_hold: "bots_log_smart_exit_hold",
  error: "bots_log_failed",
  smart_skip: "bots_log_smart_skip",
  ai_skip: "bots_log_ai_skip",
  decision_skip: "bots_log_decision_skip",
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
  reentry_cooldown: "bots_skip_reentry_cooldown",
  interval_not_elapsed: "bots_skip_interval_not_elapsed",
  ai_signal_hold: "bots_skip_ai_signal_hold",
  ai_signal_stale: "bots_skip_ai_signal_stale",
  ai_low_confidence: "bots_skip_ai_low_confidence",
  ai_side_mismatch: "bots_skip_ai_side_mismatch",
  ai_high_risk: "bots_skip_ai_high_risk",
  TREND_CONFLICT: "bots_reason_trend_conflict",
  LOW_SCORE: "bots_reason_low_score",
  MACRO_EVENT_WARNING: "bots_reason_macro_event",
  COOLDOWN_ACTIVE: "bots_reason_cooldown",
  INTERVAL_NOT_ELAPSED: "bots_skip_interval_not_elapsed",
  FUNDING_TOO_HIGH: "bots_reason_funding_high",
  MIN_NOTIONAL_ERROR: "bots_err_min_notional",
};

/** Category tailwind token for feed badges (technical / ai / risk / …). */
export function decisionCategoryClass(category: string | undefined): string {
  const accent = categoryAccent(
    (category?.toUpperCase() as "TECHNICAL" | "AI" | "RISK" | "EXECUTION" | "SYSTEM") ??
      "SYSTEM",
  );
  const map: Record<string, string> = {
    sky: "border-l-sky-500 bg-sky-950/40",
    violet: "border-l-violet-500 bg-violet-950/40",
    amber: "border-l-amber-500 bg-amber-950/40",
    rose: "border-l-rose-500 bg-rose-950/40",
    stone: "border-l-stone-400 bg-stone-100",
  };
  return map[accent] ?? map.stone;
}

export function botTickSkipLabel(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  reason: string | undefined,
  detail?: Record<string, unknown> | null,
): string {
  if (!reason) return t("bots_log_tick_skip");
  const trace = detail?.trace as { reason_code?: string; reason_message?: string } | undefined;
  if (trace?.reason_code) {
    const code = trace.reason_code as DecisionReasonCode;
    const key = `bots_reason_${code.toLowerCase()}` as keyof Messages;
    const msg = t(key);
    const labeled =
      msg && msg !== key
        ? msg
        : trace.reason_message ?? code;
    return `${t("bots_log_ignored")}${formatIgnoredLabel(code)} - ${labeled}`;
  }
  const mapped = TICK_SKIP_I18N[reason];
  if (mapped) {
    const msg = t(mapped);
    if (reason === reason.toUpperCase() && reason.includes("_")) {
      return `${t("bots_log_ignored")}${formatIgnoredLabel(reason)} - ${msg}`;
    }
    return msg;
  }
  if (reason === "interval_not_elapsed") {
    const minutes = detail?.remainingMinutes;
    const hours = detail?.intervalHours;
    if (typeof minutes === "number" && Number.isFinite(minutes)) {
      return t("bots_skip_interval_not_elapsed", {
        minutes: String(minutes),
        hours: typeof hours === "number" ? String(hours) : "?",
      });
    }
  }
  const legacy = mapLegacySkipToReasonCode(reason);
  const legacyKey = `bots_reason_${legacy.reason_code.toLowerCase()}` as keyof Messages;
  const legacyMsg = t(legacyKey);
  if (legacyMsg && legacyMsg !== legacyKey) {
    return `${t("bots_log_ignored")}${formatIgnoredLabel(legacy.reason_code)} - ${legacyMsg}`;
  }
  return `${t("bots_log_ignored")}${formatIgnoredLabel(reason)}`;
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
  if (trimmed === "kyc_required") return t("kyc_required");
  if (trimmed === "kyc_country_unsupported") return t("kyc_country_unsupported");

  const candidates = [
    trimmed,
    trimmed.toLowerCase(),
    trimmed.startsWith("bots_") ? trimmed : `bots_${trimmed.toLowerCase()}`,
  ];
  for (const key of candidates) {
    if (
      key.startsWith("bots_") ||
      key.startsWith("smart_") ||
      key.startsWith("keys_")
    ) {
      const msg = t(key as keyof Messages);
      if (msg && msg !== key) return msg;
    }
  }

  if (
    trimmed.includes("BOT_KEYS_ENCRYPTION") ||
    trimmed.includes("keys_encryption")
  ) {
    const enc = t("bots_encryption_not_configured");
    if (enc && enc !== "bots_encryption_not_configured") return enc;
    return t("bots_encryption_missing");
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

/** User-facing text for lastError or log detail - never raw Binance JSON. */
export function formatBotRuntimeError(
  raw: string | null | undefined,
  t: (k: keyof Messages) => string,
): string {
  if (!raw?.trim()) return t("bots_err_generic");

  const s = raw.trim();
  if (s.startsWith("ai_")) {
    const aiKey = `bots_skip_${s}` as keyof Messages;
    const aiMsg = t(aiKey);
    if (aiMsg && aiMsg !== aiKey) return aiMsg;
  }
  if (s.startsWith("smart_") || s.startsWith("bots_positions_")) {
    const mapped = SMART_ERROR_I18N[s];
    if (mapped) return t(mapped);
  }
  if (s.startsWith("bots_") || s.startsWith("keys_")) {
    const msg = t(s as keyof Messages);
    if (msg && msg !== s) return msg;
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
  if (
    log.action === "smart_skip" ||
    log.action === "ai_skip" ||
    log.action === "decision_skip"
  ) {
    const trace = log.detail?.trace as
      | {
          reason_code?: string;
          reason_message?: string;
          category?: string;
          score?: number;
        }
      | undefined;
    if (trace?.reason_code) {
      const key = `bots_reason_${trace.reason_code.toLowerCase()}` as keyof Messages;
      const short = t(key);
      return short && short !== key
        ? short
        : trace.reason_code.replace(/_/g, " ");
    }
    const reason =
      typeof log.detail?.reason === "string" ? log.detail.reason : null;
    const score = log.detail?.score;
    const ai = log.detail?.ai as Record<string, unknown> | undefined;
    const base =
      reason
        ? formatBotRuntimeError(reason, t)
        : log.action === "ai_skip"
          ? t("bots_log_ai_skip")
          : t("bots_log_smart_skip");
    if (typeof score === "number") {
      return `${base} (score ${score})`;
    }
    if (ai && typeof ai.confidence === "number") {
      return `${base} (${ai.confidence}%)`;
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
