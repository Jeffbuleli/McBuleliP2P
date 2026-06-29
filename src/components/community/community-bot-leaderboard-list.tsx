"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BotLeaderboardEntry } from "@/lib/community/bot-leaderboard-service";
import {
  COMMUNITY_CARD,
  COMMUNITY_CARD_ACCENT,
  COMMUNITY_EMPTY_BOX,
  COMMUNITY_FOLLOW_BTN,
  COMMUNITY_FOLLOW_BTN_OFF,
  COMMUNITY_FOLLOW_BTN_ON,
  COMMUNITY_LEADERBOARD_HANDLE,
  COMMUNITY_LEADERBOARD_NAME,
  COMMUNITY_PRIMARY_BTN,
  COMMUNITY_STAT_CELL,
  COMMUNITY_STAT_LABEL,
  COMMUNITY_STAT_VALUE,
  COMMUNITY_BADGE_PILL,
  communityRankTone,
} from "@/lib/community/community-ui";

function BotRankIcon({ rank }: { rank: number }) {
  const tone = communityRankTone(rank);
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0" aria-hidden>
      <circle cx="16" cy="16" r="14" fill={tone.bg} stroke={tone.border} strokeWidth="1" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ fill: tone.text }}
      >
        {rank}
      </text>
    </svg>
  );
}

export function CommunityBotLeaderboardList({
  fr,
  billing,
  listLimit = 20,
  onFollow,
  busyHandle,
}: {
  fr: boolean;
  billing: "demo" | "live";
  listLimit?: number;
  onFollow: (handle: string, isFollowing: boolean) => void;
  busyHandle: string | null;
}) {
  const [bots, setBots] = useState<BotLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCopyUserId, setBusyCopyUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/community/bots/leaderboard?billing=${billing}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setBots((j.bots ?? []) as BotLeaderboardEntry[]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [billing]);

  async function toggleCopy(entry: BotLeaderboardEntry, isCopying: boolean) {
    setBusyCopyUserId(entry.userId);
    try {
      if (isCopying) {
        const res = await fetch("/api/community/bots/copy-follow", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId: entry.planId, billing: entry.billing }),
        });
        if (!res.ok) return;
        setBots((list) =>
          list.map((b) =>
            b.userId === entry.userId
              ? { ...b, isCopying: false, copyFollowerCount: Math.max(0, b.copyFollowerCount - 1) }
              : b,
          ),
        );
      } else {
        const res = await fetch("/api/community/bots/copy-follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadUserId: entry.userId,
            planId: entry.planId,
            billing: entry.billing,
            sizingRatio: 0.5,
          }),
        });
        if (!res.ok) return;
        setBots((list) =>
          list.map((b) =>
            b.userId === entry.userId
              ? { ...b, isCopying: true, copyFollowerCount: b.copyFollowerCount + 1 }
              : { ...b, isCopying: false },
          ),
        );
      }
    } finally {
      setBusyCopyUserId(null);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-stone-500">…</p>;
  }

  if (!bots.length) {
    return (
      <div className={`${COMMUNITY_EMPTY_BOX} text-sm text-stone-400`}>
        <p className="font-semibold text-stone-300">
          {fr ? "Aucun bot classé." : "No ranked bots yet."}
        </p>
        <p className="mt-2 text-[11px] text-stone-500">
          {fr
            ? "Activez « Classement bots » et partagez une stratégie."
            : "Enable bot leaderboard and share a strategy."}
        </p>
        <Link href="/app/market?panel=bots" className={`${COMMUNITY_PRIMARY_BTN} mt-4`}>
          {fr ? "Ouvrir les bots" : "Open bots"}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {bots.slice(0, listLimit).map((b, idx) => {
        const rank = idx + 1;
        const isTop3 = rank <= 3;
        return (
          <li key={`${b.userId}-${b.planId}`}>
            <article
              className={`${COMMUNITY_CARD} overflow-hidden px-4 py-3 ${
                isTop3 ? "ring-1 ring-cyan-400/15" : ""
              }`}
            >
              <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
              <div className="relative flex items-start gap-3">
                <BotRankIcon rank={rank} />
                <div className="min-w-0 flex-1">
                  <Link href={`/app/community/u/${b.handle}`} className={COMMUNITY_LEADERBOARD_NAME}>
                    {b.displayName}
                  </Link>
                  <p className={COMMUNITY_LEADERBOARD_HANDLE}>@{b.handle}</p>
                  <p className={`mt-1 inline-block ${COMMUNITY_BADGE_PILL} uppercase`}>
                    {b.planId.replace("_", " ")} · {b.billing}
                  </p>
                  <dl className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                    <div className={COMMUNITY_STAT_CELL}>
                      <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Trades" : "Trades"}</dt>
                      <dd className={COMMUNITY_STAT_VALUE}>{b.tradeCount}</dd>
                    </div>
                    <div className={COMMUNITY_STAT_CELL}>
                      <dt className={COMMUNITY_STAT_LABEL}>Win rate</dt>
                      <dd className={COMMUNITY_STAT_VALUE}>
                        {b.winRate != null ? `${b.winRate}%` : "-"}
                      </dd>
                    </div>
                    <div className={COMMUNITY_STAT_CELL}>
                      <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Durée" : "Runtime"}</dt>
                      <dd className={COMMUNITY_STAT_VALUE}>{b.runtimeDays}d</dd>
                    </div>
                    <div className={COMMUNITY_STAT_CELL}>
                      <dt className={COMMUNITY_STAT_LABEL}>{fr ? "Copieurs" : "Copiers"}</dt>
                      <dd className={COMMUNITY_STAT_VALUE}>{b.copyFollowerCount}</dd>
                    </div>
                  </dl>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  {b.copyTradingEnabled ? (
                    <button
                      type="button"
                      disabled={busyCopyUserId === b.userId}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition active:scale-[0.97] disabled:opacity-50 ${
                        b.isCopying
                          ? "border border-amber-400/35 bg-amber-500/10 text-amber-300"
                          : "border border-amber-400/40 bg-amber-500/15 text-amber-200"
                      }`}
                      onClick={() => void toggleCopy(b, b.isCopying)}
                    >
                      {b.isCopying
                        ? fr
                          ? "Arrêter copy"
                          : "Stop copy"
                        : fr
                          ? "Copy perf."
                          : "Copy perf."}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyHandle === b.handle}
                    className={`${COMMUNITY_FOLLOW_BTN} ${
                      b.isFollowing ? COMMUNITY_FOLLOW_BTN_ON : COMMUNITY_FOLLOW_BTN_OFF
                    }`}
                    onClick={() => onFollow(b.handle, b.isFollowing)}
                  >
                    {b.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
                  </button>
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
