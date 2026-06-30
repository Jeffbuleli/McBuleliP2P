"use client";

import type { Messages } from "@/i18n/messages";
import type { BotOpenPositionRow } from "@/lib/bot-positions-types";

function fmtNum(v: string | undefined, maxFrac = 2) {
  if (!v) return "—";
  const n = Number.parseFloat(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n)) return v;
  return n.toLocaleString(undefined, { maximumFractionDigits: maxFrac });
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down";
}) {
  return (
    <div className="bot-fut-pos__chip">
      <span className="bot-fut-pos__chip-label">{label}</span>
      <span
        className={`bot-fut-pos__chip-value tabular-nums ${
          accent === "up"
            ? "text-[color:var(--fd-primary)]"
            : accent === "down"
              ? "text-rose-700"
              : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function BotFuturesPositionCard({
  row,
  t,
}: {
  row: BotOpenPositionRow;
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const isLong = row.side === "LONG";
  const pnlRaw = row.unrealizedPnl;
  const pnlN = pnlRaw ? Number.parseFloat(pnlRaw.replace(/,/g, "")) : NaN;
  const pnlPos = Number.isFinite(pnlN) ? pnlN >= 0 : !pnlRaw?.trim().startsWith("-");
  const otherPair = row.matchesConfig === false;

  return (
    <li
      className={`bot-fut-pos ${otherPair ? "bot-fut-pos--warn" : ""}`}
    >
      <div className="bot-fut-pos__head">
        <span
          className={`bot-fut-pos__side ${isLong ? "bot-fut-pos__side--long" : "bot-fut-pos__side--short"}`}
          aria-hidden
        >
          {isLong ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M12 4v16M7 9l5-5 5 5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M12 20V4M7 15l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
            {row.symbol.replace(/:USDT$/, "")}
          </p>
          <p className="text-[10px] font-semibold uppercase text-[color:var(--fd-muted)]">
            {isLong ? "Long" : "Short"}
            {otherPair ? (
              <span className="ml-1.5 text-rose-700">{t("bots_futures_other_badge")}</span>
            ) : null}
          </p>
        </div>
        {pnlRaw ? (
          <div
            className={`bot-fut-pos__pnl ${pnlPos ? "bot-fut-pos__pnl--up" : "bot-fut-pos__pnl--down"}`}
          >
            <span className="bot-fut-pos__pnl-label">PnL</span>
            <span className="tabular-nums">{fmtNum(pnlRaw)}</span>
          </div>
        ) : null}
      </div>
      <div className="bot-fut-pos__grid">
        <StatChip label={t("bots_pos_entry")} value={fmtNum(row.entryPrice)} />
        <StatChip label={t("bots_pos_mark")} value={fmtNum(row.markPrice)} />
        <StatChip
          label={t("bots_futures_size")}
          value={row.size ? row.size : "—"}
        />
      </div>
    </li>
  );
}
