"use client";

import Link from "next/link";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { pnlToneClass } from "@/lib/community/top-trader-ui-helpers";
import {
  COMMUNITY_AVATAR_RING,
  COMMUNITY_BADGE_PILL,
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
  communityRankTone,
} from "@/lib/community/community-ui";

function RankBadge({ rank }: { rank: number }) {
  const tone = communityRankTone(rank);
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-extrabold tabular-nums shadow-[0_0_12px_rgba(0,0,0,0.2)]"
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        borderColor: tone.border,
      }}
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
      className={`${COMMUNITY_CARD} overflow-hidden transition ${
        isTop3 ? "ring-1 ring-cyan-400/15" : ""
      }`}
    >
      <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
      <div className="relative flex items-start gap-3 px-4 py-3">
        <RankBadge rank={rank} />

        <div className="relative shrink-0">
          {entry.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.avatarUrl}
              alt=""
              className={`h-11 w-11 rounded-full object-cover ${COMMUNITY_AVATAR_RING}`}
            />
          ) : (
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/10 text-sm font-extrabold text-emerald-300 ${COMMUNITY_AVATAR_RING}`}
            >
              {entry.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Link href={profileHref} className={COMMUNITY_LEADERBOARD_NAME}>
              {entry.displayName}
            </Link>
            {entry.showKycBadge ? (
              <svg width="12" height="12" viewBox="0 0 24 24" className="shrink-0 text-emerald-400" aria-hidden>
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : null}
          </div>
          <p className={COMMUNITY_LEADERBOARD_HANDLE}>@{entry.handle}</p>

          {entry.badges.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.badges.map((b) => (
                <span key={b.slug} className={COMMUNITY_BADGE_PILL}>
                  {fr ? b.labelFr : b.labelEn}
                </span>
              ))}
            </div>
          ) : null}

          <dl className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-2 text-[10px] sm:grid-cols-4">
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Réputation" : "Reputation"}</dt>
              <dd className={COMMUNITY_STAT_VALUE}>{entry.reputationScore}</dd>
            </div>
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Abonnés" : "Followers"}</dt>
              <dd className={COMMUNITY_STAT_VALUE}>{entry.followerCount}</dd>
            </div>
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "PnL démo" : "Demo PnL"}</dt>
              <dd className={`${COMMUNITY_STAT_VALUE} ${pnlToneClass(entry.demoPnlUsdt)}`}>
                {entry.demoPnlUsdt >= 0 ? "+" : ""}
                {entry.demoPnlUsdt.toFixed(2)}
              </dd>
            </div>
            <div className={COMMUNITY_STAT_CELL}>
              <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Signaux" : "Signals"}</dt>
              <dd className={COMMUNITY_STAT_VALUE}>
                {entry.openSignals} {fr ? "ouv." : "open"}
                {entry.signalWinRate != null ? ` · ${entry.signalWinRate}%` : ""}
              </dd>
            </div>
          </dl>

          {entry.copyTradingEnabled ? (
            <p className="mt-2 text-[10px] font-semibold text-emerald-400/90">
              {fr ? "Copy trading activé" : "Copy trading enabled"}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={busyFollow}
          onClick={onFollow}
          className={`${COMMUNITY_FOLLOW_BTN} ${
            entry.isFollowing ? COMMUNITY_FOLLOW_BTN_ON : COMMUNITY_FOLLOW_BTN_OFF
          }`}
        >
          {entry.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
        </button>
      </div>
    </article>
  );
}
