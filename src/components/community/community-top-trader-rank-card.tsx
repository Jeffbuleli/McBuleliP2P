"use client";

import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import type { TopTraderLeaderboardEntry } from "@/lib/community/top-trader-types";
import { TopTraderMedalSvg } from "@/components/community/community-top-trader-illustrations";
import {
  COMMUNITY_CARD,
  COMMUNITY_CARD_ACCENT,
  COMMUNITY_FOLLOW_BTN,
  COMMUNITY_FOLLOW_BTN_OFF,
  COMMUNITY_FOLLOW_BTN_ON,
  COMMUNITY_LEADERBOARD_HANDLE,
  COMMUNITY_LEADERBOARD_NAME,
  COMMUNITY_STAT_CELL,
  COMMUNITY_STAT_LABEL,
  COMMUNITY_STAT_VALUE,
} from "@/lib/community/community-ui";

function pnlClass(n: number): string {
  return n >= 0 ? "text-emerald-400" : "text-amber-400";
}

export function CommunityTopTraderRankCard({
  fr,
  entry,
  expanded,
  onToggle,
  busyFollow,
  onFollow,
}: {
  fr: boolean;
  entry: TopTraderLeaderboardEntry;
  expanded: boolean;
  onToggle: () => void;
  busyFollow: boolean;
  onFollow: () => void;
}) {
  const profileHref = entry.handle
    ? `/app/community/u/${entry.handle}`
    : null;
  const isTop3 = entry.rank <= 3;

  return (
    <article
      className={`${COMMUNITY_CARD} overflow-hidden transition ${
        isTop3 ? "ring-1 ring-cyan-400/15" : ""
      }`}
    >
      <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
      <button
        type="button"
        onClick={onToggle}
        className="relative flex w-full items-start gap-3 px-4 py-3 text-left transition active:bg-white/[0.03]"
      >
        <div className="relative shrink-0">
          <CommunityAvatar
            label={entry.displayName}
            avatarUrl={entry.avatarUrl}
            sizeClass="h-10 w-10"
            className="ring-2 ring-cyan-400/25"
          />
          <span className="absolute -bottom-1 -right-1">
            <TopTraderMedalSvg rank={entry.rank} className="h-5 w-5" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {profileHref ? (
              <Link
                href={profileHref}
                onClick={(e) => e.stopPropagation()}
                className={COMMUNITY_LEADERBOARD_NAME}
              >
                {entry.displayName}
              </Link>
            ) : (
              <span className={COMMUNITY_LEADERBOARD_NAME}>{entry.displayName}</span>
            )}
            {entry.showKycBadge ? (
              <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0 text-emerald-400" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : null}
          </div>
          {entry.handle ? (
            <p className={COMMUNITY_LEADERBOARD_HANDLE}>@{entry.handle}</p>
          ) : null}

          <dl className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "PnL sem." : "Week PnL"}</dt>
              <dd className={`${COMMUNITY_STAT_VALUE} ${pnlClass(entry.weeklyPnlUsdt)}`}>
                {entry.weeklyPnlUsdt >= 0 ? "+" : ""}
                {entry.weeklyPnlUsdt.toFixed(2)}
              </dd>
            </div>
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Trades" : "Trades"}</dt>
              <dd className={COMMUNITY_STAT_VALUE}>{entry.tradeCount}</dd>
            </div>
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>WR</dt>
              <dd className={COMMUNITY_STAT_VALUE}>
                {entry.winRatePct != null ? `${entry.winRatePct}%` : "-"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {entry.handle ? (
            <button
              type="button"
              disabled={busyFollow}
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
              className={`${COMMUNITY_FOLLOW_BTN} ${
                entry.isFollowing ? COMMUNITY_FOLLOW_BTN_ON : COMMUNITY_FOLLOW_BTN_OFF
              }`}
            >
              {entry.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
            </button>
          ) : null}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className={`text-stone-500 transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </button>
    </article>
  );
}
