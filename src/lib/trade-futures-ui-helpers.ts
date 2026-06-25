import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";

/** Map futures / live API error codes to readable UI strings. */
export function futuresApiMessage(
  code: string | undefined | null,
  locale: Locale,
  meta?: Record<string, unknown>,
): string {
  const d = getDictionary(locale);
  const c = (code ?? "").trim();
  if (!c) return d.trade_error_generic;

  const map: Record<string, string> = {
    trade_live_not_enabled: d.trade_error_live_not_enabled,
    trade_live_admin_disabled: d.trade_live_admin_disabled,
    trade_live_graduation_required: d.trade_live_graduation_required.replace(
      "{n}",
      String(meta?.required ?? 3),
    ),
    trade_live_margin_cap: d.trade_live_margin_cap.replace(
      "{cap}",
      String(meta?.cap ?? "500"),
    ),
    trade_live_exposure_cap: d.trade_live_exposure_cap,
    trade_live_daily_loss_cap: d.trade_live_daily_loss_cap,
    trade_invalid_symbol: d.trade_invalid_symbol,
    trade_invalid_leverage: d.trade_invalid_leverage,
    trade_leverage_capped_beginner: d.trade_ui_beginner_cap.replace(
      "{max}",
      String(meta?.max ?? "5"),
    ),
    trade_invalid_margin: d.trade_invalid_margin,
    trade_price_unavailable: d.trade_price_unavailable,
    trade_invalid_stop: d.trade_invalid_stop,
    trade_invalid_tp: d.trade_invalid_tp,
    trade_insufficient_usdt: d.trade_error_insufficient_practice,
    trade_max_positions: d.trade_max_positions,
    trade_open_failed: d.trade_open_failed,
    trade_close_failed: d.trade_close_failed,
    trade_invalid_position: d.trade_invalid_position,
    trade_pi_price_unavailable: d.trade_pi_price_unavailable,
    kyc_required: d.kyc_required_trade,
    kyc_country_unsupported: d.kyc_country_unsupported,
    trade_live_enable_failed: d.trade_live_enable_failed,
    trade_house_circuit: d.trade_house_circuit,
    trade_house_capacity: d.trade_house_capacity,
    trade_house_leverage_cap: d.trade_house_leverage_cap,
  };

  return map[c] ?? c.replace(/_/g, " ");
}

export function liveEnableMessage(
  code: string | undefined | null,
  locale: Locale,
  meta?: Record<string, unknown>,
): string {
  return futuresApiMessage(code, locale, meta);
}
