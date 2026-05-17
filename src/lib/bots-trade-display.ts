import type { Messages } from "@/i18n/messages";
import type { BotLogRow } from "@/lib/bots-ui-helpers";
import {
  botLogActionLabel,
  botTickSkipLabel,
  formatBotRuntimeError,
} from "@/lib/bots-ui-helpers";

export type BotTradeHistoryChip = {
  icon: string;
  label: string;
};

export type BotTradeHistoryRow = {
  id: string;
  at: string;
  action: string;
  title: string;
  chips: BotTradeHistoryChip[];
  isClosed: boolean;
  isError: boolean;
};

export const BOT_CLOSED_ACTIONS = new Set([
  "futures_sl_close",
  "futures_tp_close",
  "futures_smart_close",
]);

export const BOT_EXECUTION_ACTIONS = new Set([
  "dca_buy",
  "grid_refresh",
  "futures_open",
  "futures_sl_close",
  "futures_tp_close",
  "futures_smart_close",
  "smart_skip",
]);

function chip(icon: string, label: string): BotTradeHistoryChip {
  return { icon, label };
}

function orderIdFromDetail(
  detail: Record<string, unknown> | null | undefined,
): string | null {
  const order = detail?.order;
  if (!order || typeof order !== "object") return null;
  const id = (order as { orderId?: number | string }).orderId;
  return id != null ? String(id) : null;
}

export function buildBotTradeHistoryRow(
  log: BotLogRow,
  t: (k: keyof Messages) => string,
): BotTradeHistoryRow {
  const d = log.detail ?? {};
  const chips: BotTradeHistoryChip[] = [];

  if (typeof d.symbol === "string") {
    chips.push(chip("◎", d.symbol));
  }
  if (typeof d.side === "string") {
    chips.push(chip(d.side === "LONG" ? "▲" : "▼", d.side));
  }
  if (typeof d.quoteAmountUsdt === "string") {
    chips.push(chip("$", `${d.quoteAmountUsdt} USDT`));
  }
  if (typeof d.marginUsdt === "string") {
    chips.push(chip("$", `${d.marginUsdt} USDT`));
  }
  if (typeof d.leverage === "number") {
    chips.push(chip("×", String(d.leverage)));
  }
  if (typeof d.signal === "string") {
    chips.push(chip("◈", d.signal));
  }
  if (typeof d.summary === "string") {
    chips.push(chip("◈", d.summary));
  }
  if (typeof d.score === "number") {
    chips.push(chip("Σ", `${d.score > 0 ? "+" : ""}${d.score}`));
  }
  if (Array.isArray(d.factors) && d.factors.length > 0) {
    const first = String(d.factors[0]);
    if (first.length < 48) chips.push(chip("•", first));
  }
  if (typeof d.ordersPlaced === "number") {
    chips.push(chip("#", String(d.ordersPlaced)));
  }
  if (typeof d.mid === "number") {
    chips.push(chip("≈", String(d.mid)));
  }
  if (typeof d.mark === "number") {
    chips.push(chip("≈", `mark ${d.mark}`));
  }
  if (typeof d.entry === "number" || typeof d.entry === "string") {
    chips.push(chip("→", String(d.entry)));
  }
  if (typeof d.profitPct === "number" && Number.isFinite(d.profitPct)) {
    chips.push(chip("PnL", `${d.profitPct.toFixed(2)}%`));
  }
  if (typeof d.timeframe === "string") {
    chips.push(chip("⏱", d.timeframe));
  }
  if (log.action === "smart_exit_hold" && typeof d.reason === "string") {
    const short =
      d.reason === "smart_exit_profit_below_min"
        ? t("smart_exit_profit_below_min")
        : d.reason === "smart_exit_no_reversal"
          ? t("smart_exit_no_reversal")
          : d.reason;
    if (short.length < 32) chips.push(chip("·", short));
  }
  const oid = orderIdFromDetail(d);
  if (oid) chips.push(chip("ID", oid.slice(-8)));

  const isError = log.action === "error";
  const isClosed = BOT_CLOSED_ACTIONS.has(log.action);

  let title = botLogActionLabel(t, log.action);
  if (log.action === "tick_skip") {
    const reason =
      typeof d.reason === "string" ? d.reason : undefined;
    title = botTickSkipLabel(t, reason);
  }
  if (isError) {
    const msg =
      typeof d.message === "string"
        ? formatBotRuntimeError(d.message, t)
        : title;
    title = msg;
  }

  return {
    id: log.id,
    at: log.createdAt,
    action: log.action,
    title,
    chips: chips.slice(0, 6),
    isClosed,
    isError,
  };
}
