"use client";

import {
  closeReasonLabel,
  closeReasonTone,
  fmtDurationMin,
  fmtTradeDt,
  fmtTradePrice,
  notionalUsdt,
  pnlBgClass,
  pnlToneClass,
  sideClass,
} from "@/lib/community/top-trader-ui-helpers";

export type FuturesHistoryRow = {
  id: string;
  symbol: string;
  side: string;
  leverage: number;
  marginUsdt: string;
  entryPrice: string;
  closePrice: string | null;
  stopLossPrice: string | null;
  takeProfitPrice: string | null;
  realizedPnlUsdt: string;
  feeOpenUsdt?: string;
  feeCloseUsdt?: string;
  closeReason: string | null;
  openedAt: string;
  closedAt: string;
};

function historyDurationMin(openedAt: string, closedAt: string): number {
  return Math.max(
    0,
    Math.round((new Date(closedAt).getTime() - new Date(openedAt).getTime()) / 60_000),
  );
}

export function FuturesTradeHistoryCard({
  row,
  fr,
  reasonLabelFn,
}: {
  row: FuturesHistoryRow;
  fr: boolean;
  reasonLabelFn?: (r: string | null) => string;
}) {
  const pnl = Number(row.realizedPnlUsdt);
  const feeOpen = Number(row.feeOpenUsdt ?? 0);
  const feeClose = Number(row.feeCloseUsdt ?? 0);
  const marketPnl = pnl + feeClose;
  const netPnl = pnl - feeOpen;
  const up = netPnl >= 0;
  const margin = Number(row.marginUsdt);
  const entry = Number(row.entryPrice);
  const exit = row.closePrice != null ? Number(row.closePrice) : null;
  const sl = row.stopLossPrice != null && row.stopLossPrice !== "" ? Number(row.stopLossPrice) : null;
  const tp = row.takeProfitPrice != null && row.takeProfitPrice !== "" ? Number(row.takeProfitPrice) : null;
  const roe = margin > 0 ? (netPnl / margin) * 100 : 0;
  const pair = row.symbol.replace("USDT", "/USDT");
  const notional = notionalUsdt(margin, row.leverage);
  const reasonTone = closeReasonTone(row.closeReason);
  const label = reasonLabelFn
    ? reasonLabelFn(row.closeReason)
    : closeReasonLabel(row.closeReason, fr);

  return (
    <article className={`rounded-2xl border-2 p-3 shadow-sm ${pnlBgClass(netPnl)}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[color:var(--fd-text)]">
            {pair}{" "}
            <span className={sideClass(row.side)}>{row.side.toUpperCase()}</span>{" "}
            <span className="text-[11px] font-bold text-[color:var(--fd-muted)]">{row.leverage}×</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-[color:var(--fd-muted)]">
            {fr ? "Entrée" : "Entry"} {fmtTradePrice(entry)}
            {exit != null ? ` · ${fr ? "Sortie" : "Exit"} ${fmtTradePrice(exit)}` : ""}
            {sl != null ? ` · SL ${fmtTradePrice(sl)}` : ""}
            {tp != null ? ` · TP ${fmtTradePrice(tp)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-extrabold tabular-nums ${pnlToneClass(netPnl)}`}>
            {up ? "+" : ""}
            {netPnl.toFixed(2)}
          </p>
          <p className="text-[10px] font-bold text-[color:var(--fd-muted)]">
            {fr ? "PnL net" : "Net PnL"}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
        <div className="rounded-lg bg-black/[0.03] px-2 py-1">
          <p className="text-[color:var(--fd-muted)]">{fr ? "PnL prix" : "Price PnL"}</p>
          <p className={`font-bold tabular-nums ${pnlToneClass(marketPnl)}`}>
            {marketPnl >= 0 ? "+" : ""}
            {marketPnl.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg bg-black/[0.03] px-2 py-1">
          <p className="text-[color:var(--fd-muted)]">{fr ? "Frais ouv." : "Open fee"}</p>
          <p className="font-bold tabular-nums text-[color:var(--fd-text)]">−{feeOpen.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-black/[0.03] px-2 py-1">
          <p className="text-[color:var(--fd-muted)]">{fr ? "Frais clô." : "Close fee"}</p>
          <p className="font-bold tabular-nums text-[color:var(--fd-text)]">−{feeClose.toFixed(2)}</p>
        </div>
        <div className="rounded-lg bg-black/[0.03] px-2 py-1">
          <p className="text-[color:var(--fd-muted)]">ROE</p>
          <p className={`font-bold tabular-nums ${pnlToneClass(roe)}`}>
            {roe >= 0 ? "+" : ""}
            {roe.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[color:var(--fd-muted)]">
        <span>
          {fr ? "Marge" : "Margin"} {margin.toFixed(2)} · {fr ? "Engagé" : "Notional"} {notional.toFixed(0)}
        </span>
        <span>{fmtDurationMin(historyDurationMin(row.openedAt, row.closedAt), fr)}</span>
      </div>

      <footer className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            reasonTone === "gain"
              ? "bg-emerald-100 text-emerald-800"
              : reasonTone === "loss"
                ? "bg-amber-100 text-amber-900"
                : "bg-stone-100 text-stone-600"
          }`}
        >
          {label}
        </span>
        <span className="text-[10px] tabular-nums text-[color:var(--fd-muted)]">
          {fmtTradeDt(row.closedAt, fr)}
        </span>
      </footer>
    </article>
  );
}
