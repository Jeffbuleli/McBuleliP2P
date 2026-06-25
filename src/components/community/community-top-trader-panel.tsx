"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  TopTraderCompetitionTrade,
  TopTraderDailyLeader,
  TopTraderFeedTrade,
  TopTraderLeaderboardEntry,
  TopTraderProgramInfo,
} from "@/lib/community/top-trader-types";
import type { TopTraderParticipantStatus } from "@/lib/community/top-trader-participant-service";
import type { TopTraderWeekWinnerView } from "@/lib/community/top-trader-payout-service";
import { CommunityTopTraderDailyLeaders } from "@/components/community/community-top-trader-daily-leaders";
import { CommunityTopTraderDayFeed } from "@/components/community/community-top-trader-day-feed";
import { CommunityTopTraderProgramCard } from "@/components/community/community-top-trader-program-card";
import { CommunityTopTraderRankCard } from "@/components/community/community-top-trader-rank-card";
import {
  CommunityTopTraderTradeCard,
} from "@/components/community/community-top-trader-trade-card";
import { CommunityTopTraderWinnerStrip } from "@/components/community/community-top-trader-winner-strip";
import { TopTraderEmptyIllustration } from "@/components/community/community-top-trader-illustrations";
import {
  groupFeedTradesByDay,
  groupUserTradesByDay,
} from "@/lib/community/top-trader-ui-helpers";

export function CommunityTopTraderPanel({ fr }: { fr: boolean }) {
  const [program, setProgram] = useState<TopTraderProgramInfo | null>(null);
  const [traders, setTraders] = useState<TopTraderLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [trades, setTrades] = useState<TopTraderCompetitionTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [myTrades, setMyTrades] = useState<TopTraderCompetitionTrade[]>([]);
  const [feedTrades, setFeedTrades] = useState<TopTraderFeedTrade[]>([]);
  const [dailyLeaders, setDailyLeaders] = useState<TopTraderDailyLeader[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const feedLoadedRef = useRef(false);
  const [viewer, setViewer] = useState<{
    rank: number;
    weeklyPnlUsdt: number;
    tradeCount: number;
  } | null>(null);
  const [participant, setParticipant] = useState<TopTraderParticipantStatus | null>(null);
  const [lastWinner, setLastWinner] = useState<TopTraderWeekWinnerView | null>(null);
  const [optInBusy, setOptInBusy] = useState(false);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/top-trader");
      const j = await res.json();
      setProgram((j.program ?? null) as TopTraderProgramInfo | null);
      setTraders((j.traders ?? []) as TopTraderLeaderboardEntry[]);
      setViewer((j.viewer ?? null) as typeof viewer);
      setParticipant((j.participant ?? null) as TopTraderParticipantStatus | null);
      setLastWinner((j.lastWinner ?? null) as TopTraderWeekWinnerView | null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent && !feedLoadedRef.current) setFeedLoading(true);
    try {
      const res = await fetch(
        `/api/community/top-trader/feed?limit=50&locale=${fr ? "fr" : "en"}`,
      );
      if (!res.ok) return;
      const j = await res.json();
      setFeedTrades((j.trades ?? []) as TopTraderFeedTrade[]);
      setDailyLeaders((j.dailyLeaders ?? []) as TopTraderDailyLeader[]);
      feedLoadedRef.current = true;
    } finally {
      setFeedLoading(false);
    }
  }, [fr]);

  const loadMyTrades = useCallback(async () => {
    try {
      const res = await fetch("/api/community/top-trader/trades?limit=15");
      if (!res.ok) return;
      const j = await res.json();
      setMyTrades((j.trades ?? []) as TopTraderCompetitionTrade[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadLeaderboard();
    void loadMyTrades();
    void loadFeed();
  }, [loadLeaderboard, loadMyTrades, loadFeed]);

  const weekLeaderUserId = traders[0]?.userId ?? null;

  const feedGroups = useMemo(() => {
    if (!program || !feedTrades.length) return [];
    return groupFeedTradesByDay(feedTrades, program, fr);
  }, [feedTrades, program, fr]);

  const myTradeGroups = useMemo(
    () => groupUserTradesByDay(myTrades, fr),
    [myTrades, fr],
  );

  const expandedEntry = traders.find((t) => t.userId === expandedUserId) ?? null;
  const expandedTradeGroups = useMemo(
    () => groupUserTradesByDay(trades, fr),
    [trades, fr],
  );

  const optIn = async () => {
    setOptInBusy(true);
    try {
      const res = await fetch("/api/community/top-trader/opt-in", { method: "POST" });
      if (!res.ok) return;
      await loadLeaderboard();
      await loadFeed(true);
    } finally {
      setOptInBusy(false);
    }
  };

  const loadTradesFor = async (handle: string | null, userId: string) => {
    setTradesLoading(true);
    setExpandedUserId(userId);
    try {
      const q = handle
        ? `?handle=${encodeURIComponent(handle)}&limit=20`
        : `?userId=${encodeURIComponent(userId)}&limit=20`;
      const res = await fetch(`/api/community/top-trader/trades${q}`);
      const j = await res.json();
      setTrades((j.trades ?? []) as TopTraderCompetitionTrade[]);
    } finally {
      setTradesLoading(false);
    }
  };

  const toggleExpand = (entry: TopTraderLeaderboardEntry) => {
    if (expandedUserId === entry.userId) {
      setExpandedUserId(null);
      setTrades([]);
      return;
    }
    void loadTradesFor(entry.handle, entry.userId);
  };

  const toggleFollow = async (handle: string, isFollowing: boolean) => {
    setBusyHandle(handle);
    try {
      const res = await fetch(`/api/community/traders/${handle}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) return;
      setTraders((list) =>
        list.map((t) =>
          t.handle === handle ? { ...t, isFollowing: !isFollowing } : t,
        ),
      );
    } finally {
      setBusyHandle(null);
    }
  };

  if (loading && !program) {
    return <p className="py-8 text-center text-sm text-[#78716c]">…</p>;
  }

  return (
    <div className="space-y-3">
      {program ? (
        <CommunityTopTraderProgramCard
          fr={fr}
          program={program}
          participant={participant}
          optInBusy={optInBusy}
          onOptIn={() => void optIn()}
        />
      ) : null}

      {lastWinner ? (
        <CommunityTopTraderWinnerStrip fr={fr} winner={lastWinner} />
      ) : null}

      {participant?.optedIn && viewer ? (
        <div className="fd-card flex items-center justify-between px-4 py-3 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
              {fr ? "Mon rang semaine" : "My week rank"}
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-[#305f33]">#{viewer.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
              {fr ? "PnL sem." : "Week PnL"}
            </p>
            <p
              className={`text-lg font-extrabold tabular-nums ${
                viewer.weeklyPnlUsdt >= 0 ? "text-[#305f33]" : "text-[#b45309]"
              }`}
            >
              {viewer.weeklyPnlUsdt >= 0 ? "+" : ""}
              {viewer.weeklyPnlUsdt.toFixed(2)}
            </p>
            <p className="text-[10px] text-[#78716c]">
              {viewer.tradeCount} {fr ? "trades" : "trades"}
            </p>
          </div>
        </div>
      ) : null}

      {dailyLeaders.length > 0 ? (
        <CommunityTopTraderDailyLeaders
          fr={fr}
          leaders={dailyLeaders}
          weekLeaderUserId={weekLeaderUserId}
        />
      ) : null}

      <section>
        <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-[#57534e]">
          {fr ? "Activité compétition" : "Competition activity"}
        </h3>

        {feedLoading && !feedLoadedRef.current ? (
          <div className="fd-card h-24 animate-pulse bg-[#f5f5f4]" aria-hidden />
        ) : feedTrades.length === 0 ? (
          <div className="fd-card flex flex-col items-center px-4 py-8 text-center shadow-sm">
            <TopTraderEmptyIllustration className="mb-3 h-20 w-20" />
            <p className="text-sm font-semibold text-[#57534e]">
              {fr ? "Aucun trade compétition" : "No competition trades yet"}
            </p>
            <p className="mt-1 text-[11px] text-[#78716c]">
              {fr ? "Rejoignez · DEMO Futures" : "Join · DEMO Futures"}
            </p>
          </div>
        ) : (
          <CommunityTopTraderDayFeed fr={fr} groups={feedGroups} />
        )}
      </section>

      {participant?.optedIn && myTrades.length > 0 ? (
        <section>
          <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-[#57534e]">
            {fr ? "Mes trades" : "My trades"}
          </h3>
          {myTradeGroups.map((g) => (
            <div key={g.dayKey} className="mb-3">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-[#a8a29e]">
                {g.heading}
              </p>
              <ul className="space-y-2">
                {g.trades.map((t) => (
                  <li key={t.id}>
                    <CommunityTopTraderTradeCard fr={fr} trade={t} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section>
        <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-[#57534e]">
          {fr ? "Classement semaine" : "Weekly ranking"}
        </h3>

        {loading ? (
          <p className="py-6 text-center text-sm text-[#78716c]">…</p>
        ) : traders.length === 0 ? (
          <p className="fd-card py-6 text-center text-sm text-[#78716c]">
            {fr ? "Pas encore de classement." : "No ranking yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {traders.map((entry) => (
              <li key={entry.userId}>
                <CommunityTopTraderRankCard
                  fr={fr}
                  entry={entry}
                  expanded={expandedUserId === entry.userId}
                  onToggle={() => toggleExpand(entry)}
                  busyFollow={busyHandle === entry.handle}
                  onFollow={() => {
                    if (entry.handle) {
                      void toggleFollow(entry.handle, entry.isFollowing);
                    }
                  }}
                />
                {expandedUserId === entry.userId ? (
                  <div className="mt-2 space-y-3 border-l-2 border-[#dce8e0] pl-3">
                    {tradesLoading ? (
                      <p className="py-4 text-center text-xs text-[#78716c]">…</p>
                    ) : trades.length === 0 ? (
                      <p className="py-2 text-center text-xs text-[#78716c]">—</p>
                    ) : (
                      expandedTradeGroups.map((g) => (
                        <div key={g.dayKey}>
                          <p className="mb-1.5 text-[10px] font-bold uppercase text-[#a8a29e]">
                            {g.heading}
                          </p>
                          <ul className="space-y-2">
                            {g.trades.map((t) => (
                              <li key={t.id}>
                                <CommunityTopTraderTradeCard
                                  fr={fr}
                                  trade={t}
                                  owner={
                                    expandedEntry
                                      ? {
                                          displayName: expandedEntry.displayName,
                                          handle: expandedEntry.handle,
                                          avatarUrl: expandedEntry.avatarUrl,
                                          showKycBadge: expandedEntry.showKycBadge,
                                        }
                                      : null
                                  }
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
