"use client";

import type { TopTraderCompetitionTrade } from "@/lib/community/top-trader-types";
import {
  TopTraderCandleIllustration,
} from "@/components/community/community-top-trader-illustrations";

function reasonLabel(r: string | null, fr: boolean): string {
  if (r === "stop_loss") return fr ? "Stop loss" : "Stop loss";
  if (r === "take_profit") return fr ? "Take profit" : "Take profit";
  if (r === "liquidated") return fr ? "Liquidation" : "Liquidated";
  if (r === "manual") return fr ? "Clôture manuelle" : "Manual close";
  if (r === "tt_max_age") return fr ? "Limite 24h" : "24h limit";
  return r ?? "—";
}

function fmtPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function fmtDt(iso: string, fr: boolean): string {
  return new Date(iso).toLocaleString(fr ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function fmtDuration(min: number, fr: boolean): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function CommunityTopTraderTradeCard({
  fr,
  trade,
}: {
  fr: boolean;
  trade: TopTraderCompetitionTrade;
}) {
  const pnl = trade.realizedPnlUsdt;
  const up = pnl >= 0;
  const sideUp = trade.side === "long";
  const pair = trade.symbol.replace("USDT", "/USDT");
  const fees = trade.feeOpenUsdt + trade.feeCloseUsdt;

  return (
    <article
      className={`rounded-xl border px-3 py-3 ${
        up
          ? "border-[#bce4c9] bg-gradient-to-br from-[#f0faf4] to-white"
          : "border-[#fcd9b6] bg-gradient-to-br from-[#fff7ed] to-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <TopTraderCandleIllustration up={sideUp} className="h-7 w-7" />
          <div>
            <p className="text-sm font-extrabold text-[#0c0a09]">
              {pair}{" "}
              <span className={sideUp ? "text-[#305f33]" : "text-[#b45309]"}>
                {trade.side.toUpperCase()}
              </span>{" "}
              <span className="text-[11px] font-bold text-[#78716c]">{trade.leverage}x</span>
            </p>
            <p className="text-[10px] text-[#a8a29e]">
              {fmtDt(trade.closedAt, fr)} GMT
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-base font-extrabold tabular-nums ${up ? "text-[#305f33]" : "text-[#b45309]"}`}>
            {up ? "+" : ""}
            {pnl.toFixed(2)}
          </p>
          <p className="text-[10px] font-semibold text-[#78716c]">USDT</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] sm:grid-cols-4">
        <div>
          <dt className="text-[#a8a29e]">{fr ? "Entrée" : "Entry"}</dt>
          <dd className="font-bold tabular-nums text-[#0c0a09]">{fmtPrice(trade.entryPrice)}</dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">{fr ? "Sortie" : "Exit"}</dt>
          <dd className="font-bold tabular-nums text-[#0c0a09]">{fmtPrice(trade.closePrice)}</dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">{fr ? "Marge" : "Margin"}</dt>
          <dd className="font-bold tabular-nums text-[#0c0a09]">{trade.marginUsdt.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">ROE</dt>
          <dd className={`font-bold tabular-nums ${up ? "text-[#305f33]" : "text-[#b45309]"}`}>
            {trade.roePct >= 0 ? "+" : ""}
            {trade.roePct.toFixed(1)}%
          </dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">SL</dt>
          <dd className="font-semibold tabular-nums text-[#57534e]">
            {trade.stopLossPrice != null ? fmtPrice(trade.stopLossPrice) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">TP</dt>
          <dd className="font-semibold tabular-nums text-[#57534e]">
            {trade.takeProfitPrice != null ? fmtPrice(trade.takeProfitPrice) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">{fr ? "Durée" : "Duration"}</dt>
          <dd className="font-semibold text-[#57534e]">
            {fmtDuration(trade.durationMin, fr)}
          </dd>
        </div>
        <div>
          <dt className="text-[#a8a29e]">{fr ? "Frais" : "Fees"}</dt>
          <dd className="font-semibold tabular-nums text-[#57534e]">{fees.toFixed(2)}</dd>
        </div>
      </dl>

      <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 text-[10px]">
        <span className="text-[#a8a29e]">{fr ? "Motif" : "Reason"}</span>
        <span className="font-semibold text-[#57534e]">{reasonLabel(trade.closeReason, fr)}</span>
      </div>
    </article>
  );
}
