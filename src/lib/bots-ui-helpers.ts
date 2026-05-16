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
  error: "bots_log_error",
};

export function botLogActionLabel(
  t: (k: keyof Messages) => string,
  action: string,
): string {
  const key = LOG_ACTION_I18N[action];
  return key ? t(key) : action;
}
