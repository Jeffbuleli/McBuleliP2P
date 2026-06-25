"use client";

import Link from "next/link";
import { memo } from "react";
import type {
  TopTraderCompetitionTrade,
  TopTraderFeedTrade,
} from "@/lib/community/top-trader-types";
import { TopTraderCandleIllustration } from "@/components/community/community-top-trader-illustrations";
import {
  closeReasonLabel,
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

function ReasonIcon({ reason }: { reason: string | null }) {
  const tone =
    reason === "take_profit"
      ? "#305f33"
      : reason === "stop_loss" || reason === "liquidated"
        ? "#b45309"
        : "#78716c";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" fill={tone} opacity="0.12" />
      {reason === "take_profit" ? (
        <path d="M8 14l3 3 5-7" stroke={tone} strokeWidth="2" fill="none" strokeLinecap="round" />
      ) : reason === "stop_loss" || reason === "liquidated" ? (
        <path d="M8 8l8 8M16 8l-8 8" stroke={tone} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M8 12h8" stroke={tone} strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function StatChip({
  icon,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  value: string;
  tone?: "gain" | "loss" | "muted";
}) {
  const cls =
    tone === "gain"
      ? "text-[#305f33]"
      : tone === "loss"
        ? "text-[#b45309]"
        : "text-[#57534e]";
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-black/5">
      {icon}
      <span className={cls}>{value}</span>
    </span>
  );
}

function TraderAvatar({ owner }: { owner: TradeOwner }) {
  if (owner.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={owner.avatarUrl}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] text-xs font-extrabold text-[#305f33] ring-2 ring-white">
      {owner.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

function TradeCardInner({
  fr,
  trade,
  owner,
  feed,
}: {
  fr: boolean;
  trade: TopTraderCompetitionTrade;
  owner?: TradeOwner | null;
  feed?: boolean;
}) {
  const netPnl = trade.realizedPnlUsdt - trade.feeOpenUsdt;
  const marketPnl = trade.realizedPnlUsdt + trade.feeCloseUsdt;
  const fees = trade.feeOpenUsdt + trade.feeCloseUsdt;
  const pair = trade.symbol.replace("USDT", "/USDT");
  const profileHref = owner?.handle ? `/app/community/u/${owner.handle}` : null;
  const sideUp = trade.side === "long";

  return (
    <article
      className={`rounded-2xl border-2 shadow-sm ${pnlBgClass(netPnl)} px-3 py-2.5 [contain:layout]`}
    >
      {owner ? (
        <header className="mb-2 flex items-center gap-2 border-b border-black/5 pb-2">
          <TraderAvatar owner={owner} />
          <div className="min-w-0 flex-1">
            {profileHref ? (
              <Link href={profileHref} className="truncate text-xs font-bold text-[#0c0a09]">
                {owner.displayName}
              </Link>
            ) : (
              <span className="truncate text-xs font-bold text-[#0c0a09]">{owner.displayName}</span>
            )}
            {owner.handle ? (
              <p className="truncate text-[10px] text-[#78716c]">@{owner.handle}</p>
            ) : null}
          </div>
          <time className="shrink-0 text-[10px] font-semibold tabular-nums text-[#a8a29e]">
            {fmtTradeTime(trade.closedAt, fr)}
          </time>
        </header>
      ) : null}

      <div className="flex items-start gap-2">
        <TopTraderCandleIllustration up={sideUp} className="mt-0.5 h-7 w-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold leading-tight text-[#0c0a09]">
            {pair}{" "}
            <span className={sideClass(trade.side)}>{trade.side.toUpperCase()}</span>{" "}
            <span className="text-[11px] text-[#78716c]">{trade.leverage}×</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[#78716c]">
            {fmtTradePrice(trade.entryPrice)} → {fmtTradePrice(trade.closePrice)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-base font-extrabold tabular-nums ${pnlToneClass(netPnl)}`}>
            {netPnl >= 0 ? "+" : ""}
            {netPnl.toFixed(2)}
          </p>
          <p className="text-[9px] font-bold uppercase text-[#a8a29e]">USDT</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatChip
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
              <path d="M4 18V6M10 18V10M16 18V14M22 18V4" stroke="#57534e" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
          value={`${marketPnl >= 0 ? "+" : ""}${marketPnl.toFixed(1)}`}
          tone={marketPnl >= 0 ? "gain" : "loss"}
        />
        <StatChip
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="8" stroke="#78716c" strokeWidth="2" fill="none" />
              <path d="M12 8v4l2 2" stroke="#78716c" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
          value={`${trade.marginUsdt.toFixed(0)}/${notionalUsdt(trade.marginUsdt, trade.leverage).toFixed(0)}`}
        />
        <StatChip
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden>
              <path d="M12 3v18M7 8h6a4 4 0 010 8H9" stroke="#78716c" strokeWidth="2" strokeLinecap="round" />
            </svg>
          }
          value={`−${fees.toFixed(2)}`}
        />
        {!feed && trade.stopLossPrice != null ? (
          <StatChip
            icon={<span className="text-[8px] font-extrabold text-[#78716c]">SL</span>}
            value={fmtTradePrice(trade.stopLossPrice)}
          />
        ) : null}
        {!feed && trade.takeProfitPrice != null ? (
          <StatChip
            icon={<span className="text-[8px] font-extrabold text-[#78716c]">TP</span>}
            value={fmtTradePrice(trade.takeProfitPrice)}
          />
        ) : null}
      </div>

      <footer className="mt-2 flex items-center justify-between gap-2 border-t border-black/5 pt-1.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#57534e]">
          <ReasonIcon reason={trade.closeReason} />
          {closeReasonLabel(trade.closeReason, fr)}
        </span>
      </footer>
    </article>
  );
}

export const CommunityTopTraderTradeCard = memo(function CommunityTopTraderTradeCard({
  fr,
  trade,
  owner,
}: {
  fr: boolean;
  trade: TopTraderCompetitionTrade;
  owner?: TradeOwner | null;
}) {
  return <TradeCardInner fr={fr} trade={trade} owner={owner} />;
});

export const CommunityTopTraderFeedTradeCard = memo(function CommunityTopTraderFeedTradeCard({
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
      feed
      owner={{ displayName, handle, avatarUrl, showKycBadge }}
    />
  );
});
