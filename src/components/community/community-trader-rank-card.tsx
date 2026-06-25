"use client";

import Link from "next/link";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { pnlToneClass } from "@/lib/community/top-trader-ui-helpers";

function RankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1 ? "#305f33" : rank === 2 ? "#57534e" : rank === 3 ? "#b45309" : "#78716c";
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold shadow-sm"
      style={{ backgroundColor: `${tone}18`, color: tone }}
    >
      {rank}
    </span>
  );
}

export function CommunityTraderRankCard({
  fr,
  rank,
  entry,
  busyFollow,
  onFollow,
}: {
  fr: boolean;
  rank: number;
  entry: TraderLeaderboardEntry;
  busyFollow: boolean;
  onFollow: () => void;
}) {
  const profileHref = `/app/community/u/${entry.handle}`;
  const isTop3 = rank <= 3;

  return (
    <article
      className={`fd-card overflow-hidden shadow-sm transition ${
        isTop3 ? "ring-1 ring-[#305f33]/15" : ""
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <RankBadge rank={rank} />

        <div className="relative shrink-0">
          {entry.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.avatarUrl}
              alt=""
              className="h-11 w-11 rounded-full object-cover ring-2 ring-[#e8f3ee]"
            />
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f3ee] text-sm font-extrabold text-[#305f33] ring-2 ring-[#dce8e0]">
              {entry.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={profileHref} className="truncate text-sm font-bold text-[#0c0a09] hover:underline">
              {entry.displayName}
            </Link>
            {entry.showKycBadge ? (
              <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0 text-[#305f33]" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : null}
          </div>
          <p className="text-[11px] text-[#78716c]">@{entry.handle}</p>

          {entry.badges.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.badges.map((b) => (
                <span
                  key={b.slug}
                  className="rounded-full bg-[#f0faf4] px-2 py-0.5 text-[9px] font-bold text-[#305f33] ring-1 ring-[#dce8e0]"
                >
                  {fr ? b.labelFr : b.labelEn}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] sm:grid-cols-4">
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#a8a29e]">{fr ? "Réputation" : "Reputation"}</dt>
              <dd className="text-sm font-extrabold tabular-nums text-[#0c0a09]">
                {entry.reputationScore}
              </dd>
            </div>
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#a8a29e]">{fr ? "Abonnés" : "Followers"}</dt>
              <dd className="text-sm font-extrabold tabular-nums text-[#0c0a09]">
                {entry.followerCount}
              </dd>
            </div>
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#a8a29e]">{fr ? "PnL démo" : "Demo PnL"}</dt>
              <dd className={`text-sm font-extrabold tabular-nums ${pnlToneClass(entry.demoPnlUsdt)}`}>
                {entry.demoPnlUsdt >= 0 ? "+" : ""}
                {entry.demoPnlUsdt.toFixed(2)}
              </dd>
            </div>
            <div className="rounded-lg bg-[#fafaf9] px-2 py-1.5">
              <dt className="text-[#a8a29e]">{fr ? "Signaux" : "Signals"}</dt>
              <dd className="text-sm font-bold tabular-nums text-[#0c0a09]">
                {entry.openSignals} {fr ? "ouv." : "open"}
                {entry.signalWinRate != null ? ` · ${entry.signalWinRate}%` : ""}
              </dd>
            </div>
          </dl>

          {entry.copyTradingEnabled ? (
            <p className="mt-2 text-[10px] font-semibold text-[#305f33]">
              {fr ? "Copy trading activé" : "Copy trading enabled"}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={busyFollow}
          onClick={onFollow}
          className={`shrink-0 self-start rounded-xl px-3 py-1.5 text-[10px] font-bold disabled:opacity-50 ${
            entry.isFollowing
              ? "border border-[#d6d3d1] text-[#57534e]"
              : "bg-[#305f33] text-white shadow-sm"
          }`}
        >
          {entry.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
        </button>
      </div>
    </article>
  );
}
