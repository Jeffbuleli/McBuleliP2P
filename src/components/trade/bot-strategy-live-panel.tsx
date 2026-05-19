"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import { BOT_CLOSED_ACTIONS } from "@/lib/bots-trade-display";
import { BotActivityFeed } from "@/components/trade/bot-activity-feed";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";
import { formatBotRuntimeError, type BotLogRow } from "@/lib/bots-ui-helpers";
import { BotFlowCard } from "@/components/trade/bots-flow-ui";

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

function fmtNum(v: string | undefined, maxFrac = 2) {
  if (!v) return v;
  const n = Number.parseFloat(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function OpenRow({
  row,
  t,
}: {
  row: BotOpenPositionRow;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  if (row.kind === "futures") {
    const pnlRaw = row.unrealizedPnl;
    const pnlN = pnlRaw ? Number.parseFloat(pnlRaw.replace(/,/g, "")) : NaN;
    const pnlPos = Number.isFinite(pnlN) ? pnlN >= 0 : !pnlRaw?.trim().startsWith("-");
    const otherPair = row.matchesConfig === false;
    return (
      <li
        className={`fd-card p-3 ${otherPair ? "border-rose-300 bg-rose-50/80" : ""}`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${
              row.side === "LONG" ? "bg-[color:var(--fd-primary)]" : "bg-rose-600"
            }`}
          >
            {row.side === "LONG" ? "L" : "S"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">
              {row.symbol}
              {otherPair ? (
                <span className="ml-2 text-[10px] font-semibold uppercase text-rose-700">
                  {t("bots_futures_other_badge")}
                </span>
              ) : null}
            </p>
            {otherPair ? (
              <p className="mt-0.5 text-[10px] text-rose-800">{t("bots_futures_other_short")}</p>
            ) : null}
            <p className="mt-1 text-xs tabular-nums text-[color:var(--fd-muted)]">
              {row.size ? `${t("bots_futures_size")} ${row.size}` : ""}
              {row.entryPrice ? ` · ${fmtNum(row.entryPrice)}` : ""}
              {row.markPrice ? ` → ${fmtNum(row.markPrice)}` : ""}
              {pnlRaw ? (
                <span className={pnlPos ? " text-[color:var(--fd-primary)]" : " text-rose-700"}>
                  {" "}
                  · PnL {fmtNum(pnlRaw)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </li>
    );
  }
  if (row.kind === "spot_order") {
    return (
      <li className="fd-card p-3 text-sm font-semibold text-[color:var(--fd-text)]">
        {row.symbol} · {row.side} @ {row.price}
      </li>
    );
  }
  return (
    <li className="fd-card p-3 text-sm">
      <span className="font-bold">{row.symbol}</span>
      <span className="text-[color:var(--fd-muted)]"> · {row.size}</span>
    </li>
  );
}

export function BotStrategyLivePanel({
  planId,
  billing,
  botActive,
  keysOk,
  logs,
  onLogsRefresh,
  onOpenChange,
  t,
}: {
  planId: BotPlanId;
  billing: "demo" | "live";
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
          `/api/trade/bots/positions?planId=${planId}&billing=${billing}`,
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
    [billing, botActive, keysOk, onOpenChange, planId, t],
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
  }, [botActive, billing, loadOpen]);

  if (!botActive) return null;

  const feedLogs = sortLogsNewest(
    logs.filter((l) => !BOT_CLOSED_ACTIONS.has(l.action)),
  ).slice(0, 20);
  const closedLogs = sortLogsNewest(
    logs.filter((l) => BOT_CLOSED_ACTIONS.has(l.action)),
  ).slice(0, 15);

  return (
    <div className="mt-4 space-y-3 border-t border-[color:var(--fd-border)] pt-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("bots_live_panel_title")}
        </h3>
        <button
          type="button"
          onClick={() => {
            void loadOpen({ silent: open.length > 0 });
            void onLogsRefreshRef.current();
          }}
          disabled={loading || !keysOk}
          className="ml-auto rounded-lg border border-[color:var(--fd-border)] px-2 py-1 text-xs font-bold text-[color:var(--fd-primary)] disabled:opacity-40"
        >
          ↻
        </button>
      </div>

      <BotFlowCard className="!p-3">
        <p className="mb-2 text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
          {t("bots_positions_open")}
        </p>
        {!keysOk ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("bots_positions_keys_hint")}</p>
        ) : loading && open.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("bots_loading")}</p>
        ) : posErr && open.length === 0 ? (
          <p className="text-xs text-amber-800">{posErr}</p>
        ) : open.length === 0 ? (
          <p className="py-4 text-center text-xs text-[color:var(--fd-muted)]">
            {t("bots_positions_empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {open.map((r, i) => (
              <OpenRow key={`${r.symbol}-${r.kind}-${i}`} row={r} t={t} />
            ))}
          </ul>
        )}
      </BotFlowCard>

      <BotFlowCard className="!p-3">
        <p className="mb-2 text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
          {t("bots_activity_feed_title")}
        </p>
        <BotActivityFeed
          logs={feedLogs}
          hidePositionOpenSkips={open.some(
            (r) => r.kind === "futures" && r.matchesConfig !== false,
          )}
          emptyLabel={t("bots_activity_feed_empty")}
          t={t}
        />
      </BotFlowCard>

      {closedLogs.length > 0 ? (
        <BotFlowCard className="!p-3">
          <p className="mb-2 text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("bots_positions_closed")}
          </p>
          <BotActivityFeed
            logs={closedLogs}
            emptyLabel={t("bots_positions_closed_empty")}
            t={t}
          />
        </BotFlowCard>
      ) : null}
    </div>
  );
}
