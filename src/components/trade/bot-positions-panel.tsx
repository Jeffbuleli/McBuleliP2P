"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import { BotChipIcon, IconCheck, IconRefresh } from "@/components/trade/bot-feed-icons";
import { IconLong, IconShort } from "@/components/trade/bot-visual-icons";
import {
  BOT_CLOSED_ACTIONS,
  BOT_EXECUTION_ACTIONS,
  buildBotTradeHistoryRow,
} from "@/lib/bots-trade-display";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";
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
    const pnl = row.unrealizedPnl ? Number.parseFloat(String(row.unrealizedPnl)) : null;
    return (
      <li className="bot-data-row flex gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--fd-border)] bg-white text-emerald-700">
          {row.side === "LONG" ? <IconLong size={18} /> : <IconShort size={18} />}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-[color:var(--fd-text)]">{row.symbol}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="bot-chip">{row.size}</span>
            {row.entryPrice ? <span className="bot-chip">{row.entryPrice}</span> : null}
            {row.markPrice ? <span className="bot-chip">{row.markPrice}</span> : null}
            {pnl != null && Number.isFinite(pnl) ? (
              <span
                className={`bot-chip ${pnl >= 0 ? "text-emerald-700" : "text-rose-700"}`}
              >
                {pnl >= 0 ? "+" : ""}
                {pnl.toFixed(2)}
              </span>
            ) : null}
          </div>
        </div>
      </li>
    );
  }
  if (row.kind === "spot_order") {
    return (
      <li className="bot-data-row flex gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--fd-border)] bg-white text-violet-700">
          <BotChipIcon kind="orders" />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-[color:var(--fd-text)]">{row.symbol}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="bot-chip">{row.side}</span>
            <span className="bot-chip">@ {row.price}</span>
            <span className="bot-chip">× {row.quantity}</span>
          </div>
        </div>
      </li>
    );
  }
  return (
    <li className="bot-data-row flex gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)]">
        <BotChipIcon kind="symbol" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-[color:var(--fd-text)]">{row.symbol}</p>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
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
      className={`bot-data-row ${
        row.isError ? "border-l-rose-400" : row.isClosed ? "opacity-80" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <time className="text-[10px] tabular-nums text-[color:var(--fd-muted)]">
          {new Date(row.at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
        {row.isClosed ? (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-stone-600">
            <IconCheck />
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-sm font-medium text-[color:var(--fd-text)]">{row.title}</p>
      {row.chips.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {row.chips.map((c, i) => (
            <span key={`${c.kind}-${i}`} className="bot-chip">
              <BotChipIcon kind={c.kind} />
              <span>{c.label}</span>
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
    <div className="mt-6 space-y-4 border-t border-[color:var(--fd-border)] pt-5">
      <div className="flex items-center gap-2">
        <BotPlanIcon planId={planId} className="h-4 w-4 opacity-60" />
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("bots_positions_open")}
        </h3>
        <button
          type="button"
          onClick={() => void loadPositions()}
          disabled={loading || !keysOk}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg border border-[color:var(--fd-border)] text-[color:var(--fd-primary)] disabled:opacity-40"
          title={t("bots_positions_refresh")}
        >
          <IconRefresh />
        </button>
      </div>

      {!keysOk ? null : loading ? (
        <p className="text-xs text-[color:var(--fd-muted)]">{t("bots_loading")}</p>
      ) : posErr ? (
        <p className="text-xs text-amber-800">{posErr}</p>
      ) : open.length === 0 ? (
        <p className="py-4 text-center text-xs text-[color:var(--fd-muted)]">
          {t("bots_positions_empty")}
        </p>
      ) : (
        <ul className="bot-data-list">
          {open.map((r, i) => (
            <OpenRow key={`${r.symbol}-${r.kind}-${i}`} row={r} t={t} />
          ))}
        </ul>
      )}

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("bots_positions_closed")}
        </h3>
        <ul className="bot-data-list mt-2 max-h-48">
          {closedLogs.length === 0 ? (
            <li className="py-3 text-center text-xs text-[color:var(--fd-muted)]">
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
        <h3 className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("bots_positions_activity")}
        </h3>
        <ul className="bot-data-list mt-2 max-h-56">
          {activityLogs.length === 0 && historyLogs.length === 0 ? (
            <li className="py-3 text-center text-xs text-[color:var(--fd-muted)]">
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
