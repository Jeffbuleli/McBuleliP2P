"use client";

import Link from "next/link";
import { CommunityAvatar } from "@/components/community/community-avatar";
import type { TopTraderLeaderboardEntry } from "@/lib/community/top-trader-types";
import { TopTraderMedalSvg } from "@/components/community/community-top-trader-illustrations";

function pnlClass(n: number): string {
  return n >= 0 ? "text-[#305f33]" : "text-[#b45309]";
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
      className={`fd-card overflow-hidden transition ${
        isTop3 ? "ring-1 ring-[#305f33]/15" : ""
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-3 text-left active:bg-[#fafaf9]"
      >
        <div className="relative shrink-0">
          <CommunityAvatar
            label={entry.displayName}
            avatarUrl={entry.avatarUrl}
            sizeClass="h-10 w-10"
            className="ring-2 ring-[#e8f3ee]"
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
                className="truncate text-sm font-bold text-[#0c0a09] hover:underline"
              >
                {entry.displayName}
              </Link>
            ) : (
              <span className="truncate text-sm font-bold text-[#0c0a09]">
                {entry.displayName}
              </span>
            )}
            {entry.showKycBadge ? (
              <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0 text-[#305f33]" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : null}
          </div>
          {entry.handle ? (
            <p className="text-[11px] text-[#78716c]">@{entry.handle}</p>
          ) : null}

          <dl className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <dt className="text-[#a8a29e]">{fr ? "PnL sem." : "Week PnL"}</dt>
              <dd className={`text-sm font-extrabold tabular-nums ${pnlClass(entry.weeklyPnlUsdt)}`}>
                {entry.weeklyPnlUsdt >= 0 ? "+" : ""}
                {entry.weeklyPnlUsdt.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-[#a8a29e]">{fr ? "Trades" : "Trades"}</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0c0a09]">
                {entry.tradeCount}
              </dd>
            </div>
            <div>
              <dt className="text-[#a8a29e]">WR</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0c0a09]">
                {entry.winRatePct != null ? `${entry.winRatePct}%` : "—"}
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
              className={`rounded-xl px-2.5 py-1 text-[10px] font-bold disabled:opacity-50 ${
                entry.isFollowing
                  ? "border border-[#d6d3d1] text-[#57534e]"
                  : "bg-[#305f33] text-white"
              }`}
            >
              {entry.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
            </button>
          ) : null}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className={`text-[#a8a29e] transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </button>
    </article>
  );
}
