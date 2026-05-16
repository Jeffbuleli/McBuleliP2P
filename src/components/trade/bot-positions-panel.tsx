"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
  BOT_CLOSED_ACTIONS,
  BOT_EXECUTION_ACTIONS,
  buildBotTradeHistoryRow,
} from "@/lib/bots-trade-display";
import type { BotOpenPositionRow } from "@/lib/bot-positions-service";
import { formatBotRuntimeError, type BotLogRow } from "@/lib/bots-ui-helpers";
import { BotPlanIcon } from "@/components/trade/bot-strategy-icons";

function OpenRow({
  row,
  t,
}: {
  row: BotOpenPositionRow;
  t: (k: keyof Messages) => string;
}) {
  if (row.kind === "futures") {
    return (
      <li className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/30">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 text-lg dark:bg-amber-900/50">
          {row.side === "LONG" ? "▲" : "▼"}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold text-amber-950 dark:text-amber-100">{row.symbol}</p>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-400">
            <span>◎ {row.size}</span>
            {row.entryPrice ? <span>→ {row.entryPrice}</span> : null}
            {row.markPrice ? <span>≈ {row.markPrice}</span> : null}
            {row.unrealizedPnl ? (
              <span
                className={
                  Number(row.unrealizedPnl) >= 0
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }
              >
                PnL {row.unrealizedPnl}
              </span>
            ) : null}
          </p>
        </div>
      </li>
    );
  }
  if (row.kind === "spot_order") {
    return (
      <li className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-800 dark:bg-violet-950/30">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-200/80 text-sm font-bold dark:bg-violet-900/50">
          LIMIT
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold text-violet-950 dark:text-violet-100">{row.symbol}</p>
          <p className="mt-1 flex flex-wrap gap-2 text-xs text-stone-600 dark:text-stone-400">
            <span>{row.side}</span>
            <span>@ {row.price}</span>
            <span>× {row.quantity}</span>
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-200/80 text-lg dark:bg-emerald-900/50">
        ◎
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-emerald-950 dark:text-emerald-100">{row.symbol}</p>
        <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
          {t("bots_holding_size")}: {row.size}
        </p>
      </div>
    </li>
  );
}

function HistoryRow({
  row,
}: {
  row: ReturnType<typeof buildBotTradeHistoryRow>;
}) {
  return (
    <li
      className={`rounded-xl border px-3 py-2.5 text-sm ${
        row.isError
          ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
          : row.isClosed
            ? "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/40"
            : "border-stone-200/80 bg-white dark:border-stone-700 dark:bg-stone-900/60"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-stone-500">
          {new Date(row.at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {row.isClosed ? (
          <span className="rounded-full bg-stone-300 px-2 py-0.5 text-[10px] font-bold uppercase text-stone-800 dark:bg-stone-600 dark:text-stone-100">
            ✓
          </span>
        ) : null}
      </div>
      <p className="mt-1 font-medium leading-snug">{row.title}</p>
      {row.chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {row.chips.map((c, i) => (
            <span
              key={`${c.icon}-${i}`}
              className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs dark:bg-stone-800"
            >
              <span className="font-bold text-stone-500">{c.icon}</span>
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function BotPositionsPanel({
  planId,
  logs,
  keysOk,
  t,
}: {
  planId: BotPlanId;
  logs: BotLogRow[];
  keysOk: boolean;
  t: (k: keyof Messages) => string;
}) {
  const [open, setOpen] = useState<BotOpenPositionRow[]>([]);
  const [posErr, setPosErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPositions = useCallback(async () => {
    if (!keysOk) {
      setOpen([]);
      return;
    }
    setLoading(true);
    setPosErr(null);
    try {
      const res = await fetch(
        `/api/trade/bots/positions?planId=${planId}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = typeof json.error === "string" ? json.error : "";
        setPosErr(err ? formatBotRuntimeError(err, t) : t("bots_err_generic"));
        setOpen([]);
        return;
      }
      setOpen(Array.isArray(json.open) ? json.open : []);
      if (typeof json.error === "string" && json.error) {
        setPosErr(formatBotRuntimeError(json.error, t));
      }
    } finally {
      setLoading(false);
    }
  }, [keysOk, planId, t]);

  useEffect(() => {
    void loadPositions();
  }, [loadPositions]);

  const historyLogs = logs.filter(
    (l) => BOT_EXECUTION_ACTIONS.has(l.action) || l.action === "error",
  );
  const closedLogs = logs.filter((l) => BOT_CLOSED_ACTIONS.has(l.action));
  const activityLogs = logs.filter(
    (l) =>
      BOT_EXECUTION_ACTIONS.has(l.action) && !BOT_CLOSED_ACTIONS.has(l.action),
  );

  return (
    <div className="mt-6 space-y-5 border-t border-stone-200/80 pt-5 dark:border-stone-700/80">
      <div className="flex items-center gap-2">
        <BotPlanIcon planId={planId} className="h-5 w-5 opacity-70" />
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400">
          {t("bots_positions_open")}
        </h3>
        <button
          type="button"
          onClick={() => void loadPositions()}
          disabled={loading || !keysOk}
          className="ml-auto rounded-lg border border-stone-300 px-2 py-0.5 text-xs font-semibold disabled:opacity-40 dark:border-stone-600"
          title={t("bots_positions_refresh")}
        >
          ↻
        </button>
      </div>

      {!keysOk ? (
        <p className="text-xs text-stone-500">{t("bots_positions_keys_hint")}</p>
      ) : loading ? (
        <p className="text-xs text-stone-500">{t("bots_loading")}</p>
      ) : posErr ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">{posErr}</p>
      ) : open.length === 0 ? (
        <p className="rounded-lg bg-stone-50 px-3 py-4 text-center text-xs text-stone-500 dark:bg-stone-800/50">
          {t("bots_positions_empty")}
        </p>
      ) : (
        <ul className="space-y-2">{open.map((r, i) => (
          <OpenRow key={`${r.symbol}-${r.kind}-${i}`} row={r} t={t} />
        ))}</ul>
      )}

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400">
          {t("bots_positions_closed")}
        </h3>
        {closedLogs.length === 0 && planId !== "futures_um" ? (
          <p className="mt-2 text-xs text-stone-500">{t("bots_history_spot_hint")}</p>
        ) : null}
        <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
          {closedLogs.length === 0 ? (
            <li className="rounded-lg bg-stone-50 px-3 py-3 text-center text-xs text-stone-500 dark:bg-stone-800/50">
              {t("bots_positions_closed_empty")}
            </li>
          ) : (
            closedLogs.map((l) => (
              <HistoryRow
                key={l.id}
                row={buildBotTradeHistoryRow(l, t)}
              />
            ))
          )}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400">
          {t("bots_positions_activity")}
        </h3>
        <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
          {activityLogs.length === 0 && historyLogs.length === 0 ? (
            <li className="rounded-lg bg-stone-50 px-3 py-3 text-center text-xs text-stone-500 dark:bg-stone-800/50">
              {t("bots_logs_empty")}
            </li>
          ) : (
            [...activityLogs, ...historyLogs.filter((l) => l.action === "error")]
              .slice(0, 20)
              .map((l) => (
                <HistoryRow
                  key={l.id}
                  row={buildBotTradeHistoryRow(l, t)}
                />
              ))
          )}
        </ul>
      </div>
    </div>
  );
}
