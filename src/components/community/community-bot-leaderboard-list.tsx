"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BotLeaderboardEntry } from "@/lib/community/bot-leaderboard-service";

function BotRankIcon({ rank }: { rank: number }) {
  const tone =
    rank === 1 ? "#305f33" : rank === 2 ? "#57534e" : rank === 3 ? "#b45309" : "#78716c";
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="14" fill={tone} opacity="0.12" />
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-current text-sm font-bold"
        style={{ fill: tone }}
      >
        {rank}
      </text>
    </svg>
  );
}

export function CommunityBotLeaderboardList({
  fr,
  billing,
  onFollow,
  busyHandle,
}: {
  fr: boolean;
  billing: "demo" | "live";
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
    return <p className="py-8 text-center text-sm text-[#78716c]">…</p>;
  }

  if (!bots.length) {
    return (
      <div className="fd-card px-4 py-8 text-center text-sm text-[#57534e]">
        <p>{fr ? "Aucun bot classé." : "No ranked bots yet."}</p>
        <p className="mt-2 text-[11px] text-[#78716c]">
          {fr
            ? "Activez « Classement bots » et partagez une stratégie."
            : "Enable bot leaderboard and share a strategy."}
        </p>
        <Link
          href="/app/market?panel=bots"
          className="mt-3 inline-block rounded-xl bg-[#305f33] px-4 py-2 text-xs font-bold text-white"
        >
          {fr ? "Ouvrir les bots" : "Open bots"}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bots.map((b, idx) => (
        <li key={`${b.userId}-${b.planId}`}>
          <article className="fd-card px-4 py-3">
            <div className="flex items-start gap-3">
              <BotRankIcon rank={idx + 1} />
              <div className="min-w-0 flex-1">
                <Link href={`/app/community/u/${b.handle}`} className="text-sm font-bold text-[#0c0a09]">
                  {b.displayName}
                </Link>
                <p className="text-xs text-[#78716c]">@{b.handle}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase text-[#305f33]">
                  {b.planId.replace("_", " ")} · {b.billing}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div>
                    <dt className="text-[#a8a29e]">{fr ? "Trades" : "Trades"}</dt>
                    <dd className="font-semibold">{b.tradeCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#a8a29e]">Win rate</dt>
                    <dd className="font-semibold">
                      {b.winRate != null ? `${b.winRate}%` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#a8a29e]">{fr ? "Durée" : "Runtime"}</dt>
                    <dd className="font-semibold">{b.runtimeDays}d</dd>
                  </div>
                  <div>
                    <dt className="text-[#a8a29e]">{fr ? "Copieurs" : "Copiers"}</dt>
                    <dd className="font-semibold">{b.copyFollowerCount}</dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                {b.copyTradingEnabled ? (
                  <button
                    type="button"
                    disabled={busyCopyUserId === b.userId}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                      b.isCopying
                        ? "border border-amber-500 text-amber-800"
                        : "bg-amber-600 text-white"
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
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                    b.isFollowing
                      ? "border border-[#d6d3d1] text-[#57534e]"
                      : "bg-[#305f33] text-white"
                  }`}
                  onClick={() => onFollow(b.handle, b.isFollowing)}
                >
                  {b.isFollowing ? (fr ? "Suivi" : "Following") : fr ? "Suivre" : "Follow"}
                </button>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
