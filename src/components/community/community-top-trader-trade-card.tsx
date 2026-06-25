"use client";

import Link from "next/link";
import type {
  TopTraderCompetitionTrade,
  TopTraderFeedTrade,
} from "@/lib/community/top-trader-types";
import {
  closeReasonLabel,
  closeReasonTone,
  fmtDurationMin,
  fmtTradeDt,
  fmtTradePrice,
  fmtTradeTime,
  notionalUsdt,
  pnlBgClass,
  pnlToneClass,
  sideClass,
} from "@/lib/community/top-trader-ui-helpers";

type TradeOwner = {
  displayName: string;
  handle: string | null;
  avatarUrl: string | null;
  showKycBadge?: boolean;
};

function TraderAvatar({
  owner,
  size = "md",
}: {
  owner: TradeOwner;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  if (owner.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={owner.avatarUrl}
        alt=""
        className={`${cls} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <span
      className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] font-extrabold text-[#305f33] ring-2 ring-white shadow-sm`}
    >
      {owner.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

function TradeCardInner({
  fr,
  trade,
  owner,
  compact,
}: {
  fr: boolean;
  trade: TopTraderCompetitionTrade;
  owner?: TradeOwner | null;
  compact?: boolean;
}) {
  const pnl = trade.realizedPnlUsdt;
  const up = pnl >= 0;
  const pair = trade.symbol.replace("USDT", "/USDT");
  const fees = trade.feeOpenUsdt + trade.feeCloseUsdt;
  const notional = notionalUsdt(trade.marginUsdt, trade.leverage);
  const reasonTone = closeReasonTone(trade.closeReason);
  const profileHref = owner?.handle ? `/app/community/u/${owner.handle}` : null;

  return (
    <article
      className={`rounded-2xl border-2 shadow-sm ${pnlBgClass(pnl)} ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      }`}
    >
      {owner ? (
        <header className="mb-2.5 flex items-center gap-2 border-b border-black/5 pb-2">
          <TraderAvatar owner={owner} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="truncate text-xs font-bold text-[#0c0a09] hover:underline"
                >
                  {owner.displayName}
                </Link>
              ) : (
                <span className="truncate text-xs font-bold text-[#0c0a09]">
                  {owner.displayName}
                </span>
              )}
              {owner.showKycBadge ? (
                <svg width="10" height="10" viewBox="0 0 24 24" className="shrink-0 text-[#305f33]" aria-hidden>
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                  <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              ) : null}
            </div>
            {owner.handle ? (
              <p className="truncate text-[10px] text-[#78716c]">@{owner.handle}</p>
            ) : null}
          </div>
          <time className="shrink-0 text-[10px] font-semibold tabular-nums text-[#a8a29e]">
            {fmtTradeTime(trade.closedAt, fr)}
          </time>
        </header>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#0c0a09]">
            {pair}{" "}
            <span className={sideClass(trade.side)}>{trade.side.toUpperCase()}</span>{" "}
            <span className="text-[11px] font-bold text-[#78716c]">{trade.leverage}×</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] leading-relaxed text-[#78716c]">
            {fr ? "Entrée" : "Entry"} {fmtTradePrice(trade.entryPrice)} · {fr ? "Sortie" : "Exit"}{" "}
            {fmtTradePrice(trade.closePrice)}
            {trade.stopLossPrice != null ? ` · SL ${fmtTradePrice(trade.stopLossPrice)}` : ""}
            {trade.takeProfitPrice != null ? ` · TP ${fmtTradePrice(trade.takeProfitPrice)}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-extrabold tabular-nums ${pnlToneClass(pnl)}`}>
            {up ? "+" : ""}
            {pnl.toFixed(2)}
          </p>
          <p className="text-[10px] font-bold text-[#78716c]">USDT</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        <span className={pnlToneClass(pnl)}>
          ROE {trade.roePct >= 0 ? "+" : ""}
          {trade.roePct.toFixed(1)}%
        </span>
        <span className="text-[#78716c]">
          {fr ? "Marge" : "Margin"} {trade.marginUsdt.toFixed(2)} · {fr ? "Engagé" : "Notional"}{" "}
          {notional.toFixed(0)}
        </span>
        <span className="text-[#78716c]">
          {fmtDurationMin(trade.durationMin, fr)} · {fr ? "Frais" : "Fees"} {fees.toFixed(2)}
        </span>
      </div>

      <footer className="mt-2.5 flex items-center justify-between gap-2 border-t border-black/5 pt-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            reasonTone === "gain"
              ? "bg-[#dce8e0] text-[#305f33]"
              : reasonTone === "loss"
                ? "bg-[#fde8d8] text-[#b45309]"
                : "bg-[#f5f5f4] text-[#57534e]"
          }`}
        >
          {closeReasonLabel(trade.closeReason, fr)}
        </span>
        <span className="text-[10px] tabular-nums text-[#a8a29e]">
          {fmtTradeDt(trade.closedAt, fr)} GMT
        </span>
      </footer>
    </article>
  );
}

export function CommunityTopTraderTradeCard({
  fr,
  trade,
  owner,
  compact,
}: {
  fr: boolean;
  trade: TopTraderCompetitionTrade;
  owner?: TradeOwner | null;
  compact?: boolean;
}) {
  return <TradeCardInner fr={fr} trade={trade} owner={owner} compact={compact} />;
}

export function CommunityTopTraderFeedTradeCard({
  fr,
  trade,
}: {
  fr: boolean;
  trade: TopTraderFeedTrade;
}) {
  const { displayName, handle, avatarUrl, showKycBadge, ...base } = trade;
  return (
    <TradeCardInner
      fr={fr}
      trade={base}
      owner={{ displayName, handle, avatarUrl, showKycBadge }}
    />
  );
}
