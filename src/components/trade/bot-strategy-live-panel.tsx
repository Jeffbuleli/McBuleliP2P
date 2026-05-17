"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import {
  BOT_CLOSED_ACTIONS,
  buildBotTradeHistoryRow,
} from "@/lib/bots-trade-display";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";
import { formatBotRuntimeError, type BotLogRow } from "@/lib/bots-ui-helpers";
import { UiSectionTitle } from "@/components/ui/ui-info-tip";

const POLL_MS = 12_000;

function openRowsEqual(a: BotOpenPositionRow[], b: BotOpenPositionRow[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (row, i) =>
      row.symbol === b[i]?.symbol &&
      row.kind === b[i]?.kind &&
      row.size === b[i]?.size,
  );
}

function sortLogsNewest(logs: BotLogRow[]) {
  return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function formatPnlLabel(pnl: string | undefined) {
  if (!pnl) return null;
  const n = Number.parseFloat(pnl.replace(/,/g, ""));
  const positive = Number.isFinite(n) ? n >= 0 : !pnl.trim().startsWith("-");
  return {
    text: pnl,
    className: positive
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300",
  };
}

function OpenRow({
  row,
  t,
}: {
  row: BotOpenPositionRow;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  if (row.kind === "futures") {
    const pnl = formatPnlLabel(row.unrealizedPnl);
    return (
      <li className="flex items-start gap-3 rounded-xl border border-amber-300/70 bg-gradient-to-br from-amber-50 to-amber-100/40 p-3 shadow-sm dark:border-amber-700/50 dark:from-amber-950/40 dark:to-amber-950/15">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${
            row.side === "LONG" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {row.side === "LONG" ? "L" : "S"}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold text-amber-950 dark:text-amber-50">{row.symbol}</p>
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            {row.size ? (
              <>
                <dt className="text-stone-500">{t("bots_futures_size")}</dt>
                <dd className="font-medium text-stone-800 dark:text-stone-200">
                  {row.size}
                </dd>
              </>
            ) : null}
            {row.entryPrice ? (
              <>
                <dt className="text-stone-500">{t("bots_futures_entry")}</dt>
                <dd className="font-medium text-stone-800 dark:text-stone-200">
                  {row.entryPrice}
                </dd>
              </>
            ) : null}
            {row.markPrice ? (
              <>
                <dt className="text-stone-500">{t("bots_futures_mark")}</dt>
                <dd className="font-medium text-stone-800 dark:text-stone-200">
                  {row.markPrice}
                </dd>
              </>
            ) : null}
            {pnl ? (
              <>
                <dt className="text-stone-500">PnL</dt>
                <dd className={`font-semibold ${pnl.className}`}>{pnl.text}</dd>
              </>
            ) : null}
          </dl>
        </div>
      </li>
    );
  }
  if (row.kind === "spot_order") {
    return (
      <li className="rounded-xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-800 dark:bg-violet-950/30">
        <p className="text-sm font-bold text-violet-950 dark:text-violet-100">
          {row.symbol} · {row.side} @ {row.price}
        </p>
      </li>
    );
  }
  return (
    <li className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
      <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
        {row.symbol}
      </p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
        {t("bots_holding_size")}: {row.size}
      </p>
    </li>
  );
}

function ActivityLine({
  log,
  t,
}: {
  log: BotLogRow;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const row = buildBotTradeHistoryRow(log, t);
  const isErr = log.action === "error";
  const isSkip = log.action === "smart_skip";
  const isTickSkip = log.action === "tick_skip";
  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm ${
        isErr
          ? "border-rose-300 bg-rose-50/90 dark:border-rose-800 dark:bg-rose-950/40"
          : isSkip
            ? "border-sky-300/80 bg-sky-50/60 dark:border-sky-800 dark:bg-sky-950/30"
            : isTickSkip
              ? "border-amber-300/70 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/25"
              : "border-stone-200/80 bg-white/80 dark:border-stone-700 dark:bg-stone-900/50"
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
        <time dateTime={log.createdAt}>
          {new Date(log.createdAt).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </time>
      </div>
      <p className="mt-1 font-medium leading-snug">{row.title}</p>
      {row.chips.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {row.chips.slice(0, 4).map((c, i) => (
            <span
              key={`${c.icon}-${i}`}
              className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] dark:bg-stone-800"
            >
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function BotStrategyLivePanel({
  planId,
  botActive,
  keysOk,
  logs,
  onLogsRefresh,
  onOpenChange,
  t,
}: {
  planId: BotPlanId;
  botActive: boolean;
  keysOk: boolean;
  logs: BotLogRow[];
  onLogsRefresh: () => Promise<void>;
  onOpenChange?: (rows: BotOpenPositionRow[]) => void;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = useState<BotOpenPositionRow[]>([]);
  const [posErr, setPosErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onLogsRefreshRef = useRef(onLogsRefresh);
  onLogsRefreshRef.current = onLogsRefresh;

  const loadOpen = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!keysOk || !botActive) {
        setOpen([]);
        onOpenChange?.([]);
        return;
      }
      if (!opts?.silent) setLoading(true);
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
        const next = Array.isArray(json.open) ? json.open : [];
        setOpen((prev) => {
          const same = openRowsEqual(prev, next);
          if (!same) onOpenChange?.(next);
          return same ? prev : next;
        });
        if (next.length === 0) onOpenChange?.([]);
        if (typeof json.error === "string" && json.error) {
          setPosErr(formatBotRuntimeError(json.error, t));
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [botActive, keysOk, onOpenChange, planId, t],
  );

  useEffect(() => {
    if (!botActive) return;
    void loadOpen();
    void onLogsRefreshRef.current();
    const id = window.setInterval(() => {
      void loadOpen({ silent: true });
      void onLogsRefreshRef.current();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [botActive, loadOpen]);

  if (!botActive) {
    return null;
  }

  const feedLogs = sortLogsNewest(
    logs.filter((l) => !BOT_CLOSED_ACTIONS.has(l.action)),
  ).slice(0, 25);
  const closedLogs = sortLogsNewest(
    logs.filter((l) => BOT_CLOSED_ACTIONS.has(l.action)),
  ).slice(0, 25);

  return (
    <div className="mt-6 space-y-5 border-t border-stone-200/80 pt-5 dark:border-stone-700/80">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-stone-600 dark:text-stone-400">
          <UiSectionTitle
            title={t("bots_live_panel_title")}
            tip={t("bots_live_panel_tip")}
          />
        </h3>
        <button
          type="button"
          onClick={() => {
            void loadOpen({ silent: open.length > 0 });
            void onLogsRefreshRef.current();
          }}
          disabled={loading || !keysOk}
          className="ml-auto rounded-lg border border-stone-300 px-2 py-0.5 text-xs font-semibold disabled:opacity-40 dark:border-stone-600"
          title={t("bots_positions_refresh")}
        >
          ↻
        </button>
      </div>

      <section>
        <h4 className="text-xs font-semibold uppercase text-stone-500">
          <UiSectionTitle
            title={t("bots_positions_open")}
            tip={t("bots_open_binance_sync")}
          />
        </h4>
        {!keysOk ? (
          <p className="mt-2 text-xs text-stone-500">{t("bots_positions_keys_hint")}</p>
        ) : loading && open.length === 0 ? (
          <p className="mt-2 text-xs text-stone-500">{t("bots_loading")}</p>
        ) : posErr && open.length === 0 ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">{posErr}</p>
        ) : open.length === 0 ? (
          <p className="mt-2 rounded-lg bg-stone-50 px-3 py-3 text-center text-xs text-stone-500 dark:bg-stone-800/50">
            {t("bots_positions_empty")}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {open.map((r, i) => (
              <OpenRow key={`${r.symbol}-${r.kind}-${i}`} row={r} t={t} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase text-stone-500">
          {t("bots_activity_feed_title")}
        </h4>
        {feedLogs.length === 0 ? (
          <p className="mt-2 text-xs text-stone-500">{t("bots_activity_feed_empty")}</p>
        ) : (
          <ul className="mt-2 max-h-72 space-y-2 overflow-y-auto">
            {feedLogs.map((l) => (
              <ActivityLine key={l.id} log={l} t={t} />
            ))}
          </ul>
        )}
      </section>

      {closedLogs.length > 0 ? (
        <section>
          <h4 className="text-xs font-semibold uppercase text-stone-500">
            {t("bots_positions_closed")}
          </h4>
          <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto">
            {closedLogs.map((l) => (
              <ActivityLine key={l.id} log={l} t={t} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
