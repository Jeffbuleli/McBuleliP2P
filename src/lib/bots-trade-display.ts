import type { Messages } from "@/i18n/messages";
import type { BotChipKind } from "@/components/trade/bot-feed-icons";
import type { BotLogRow } from "@/lib/bots-ui-helpers";
import {
  botLogActionLabel,
  botTickSkipLabel,
  formatBotRuntimeError,
} from "@/lib/bots-ui-helpers";

export type BotTradeHistoryChip = {
  kind: BotChipKind;
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
  "futures_trailing_close",
]);

export const BOT_EXECUTION_ACTIONS = new Set([
  "dca_buy",
  "grid_refresh",
  "futures_open",
  "futures_sl_close",
  "futures_tp_close",
  "futures_smart_close",
  "futures_trailing_close",
  "smart_skip",
  "decision_skip",
]);

function chip(kind: BotChipKind, label: string): BotTradeHistoryChip {
  return { kind, label };
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
    chips.push(chip("symbol", d.symbol));
  }
  if (typeof d.side === "string") {
    chips.push(
      chip(d.side === "LONG" ? "side_long" : "side_short", d.side),
    );
  }
  if (typeof d.quoteAmountUsdt === "string") {
    chips.push(chip("quote", `${d.quoteAmountUsdt} USDT`));
  }
  if (typeof d.marginUsdt === "string") {
    chips.push(chip("margin", `${d.marginUsdt} USDT`));
  }
  if (typeof d.leverage === "number") {
    chips.push(chip("leverage", `${d.leverage}×`));
  }
  if (typeof d.signal === "string") {
    chips.push(chip("signal", d.signal));
  }
  if (typeof d.summary === "string") {
    chips.push(chip("signal", d.summary));
  }
  if (typeof d.score === "number") {
    chips.push(chip("score", `${d.score > 0 ? "+" : ""}${d.score}`));
  }
  if (Array.isArray(d.factors) && d.factors.length > 0) {
    const first = String(d.factors[0]);
    if (first.length < 48) chips.push(chip("factor", first));
  }
  if (typeof d.ordersPlaced === "number") {
    chips.push(chip("orders", String(d.ordersPlaced)));
  }
  if (typeof d.mid === "number") {
    chips.push(chip("mark", String(d.mid)));
  }
  if (typeof d.mark === "number") {
    chips.push(chip("mark", `mark ${d.mark}`));
  }
  if (typeof d.entry === "number" || typeof d.entry === "string") {
    chips.push(chip("entry", String(d.entry)));
  }
  if (typeof d.profitPct === "number" && Number.isFinite(d.profitPct)) {
    chips.push(chip("pnl", `${d.profitPct.toFixed(2)}%`));
  }
  if (typeof d.triggerPct === "number" && Number.isFinite(d.triggerPct)) {
    chips.push(chip("trigger", `${d.triggerPct}%`));
  }
  if (typeof d.peakProfitPct === "number" && Number.isFinite(d.peakProfitPct)) {
    chips.push(chip("peak", `${d.peakProfitPct.toFixed(2)}%`));
  }
  if (typeof d.retracePct === "number" && Number.isFinite(d.retracePct)) {
    chips.push(chip("retrace", `${d.retracePct.toFixed(2)}%`));
  }
  if (typeof d.timeframe === "string") {
    chips.push(chip("timeframe", d.timeframe));
  }
  if (log.action === "smart_exit_hold" && typeof d.reason === "string") {
    const short =
      d.reason === "smart_exit_profit_below_min"
        ? t("smart_exit_profit_below_min")
        : d.reason === "smart_exit_no_reversal"
          ? t("smart_exit_no_reversal")
          : d.reason;
    if (short.length < 32) chips.push(chip("factor", short));
  }
  const oid = orderIdFromDetail(d);
  if (oid) chips.push(chip("order_id", oid.slice(-8)));

  const isError = log.action === "error";
  const isClosed = BOT_CLOSED_ACTIONS.has(log.action);

  let title = botLogActionLabel(t, log.action);
  if (log.action === "tick_skip") {
    const reason =
      typeof d.reason === "string" ? d.reason : undefined;
    title = botTickSkipLabel(t, reason, d);
  }
  if (log.action === "smart_skip" || log.action === "decision_skip") {
    const trace = d.trace as { reason_code?: string } | undefined;
    if (trace?.reason_code) {
      title = trace.reason_code.replace(/_/g, " ");
    } else {
      const score = typeof d.score === "number" ? d.score : null;
      const min = typeof d.minRequired === "number" ? d.minRequired : null;
      if (score != null && min != null) title = `${score} / ${min}`;
    }
  }
  if (log.action === "ai_skip") {
    const ai = d.ai as { confidence?: number; action?: string } | undefined;
    const conf =
      ai && typeof ai.confidence === "number" ? ai.confidence : null;
    const min = typeof d.minAiRequired === "number" ? d.minAiRequired : null;
    if (conf != null && min != null) title = `${conf} / ${min}`;
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
    chips: chips.slice(0, 5),
    isClosed,
    isError,
  };
}
