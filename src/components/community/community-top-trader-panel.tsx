"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  TopTraderCompetitionTrade,
  TopTraderDailyLeader,
  TopTraderFeedTrade,
  TopTraderLeaderboardEntry,
  TopTraderProgramInfo,
  TopTraderProgramWeek,
  TopTraderWeekHistoryEntry,
  TopTraderWeekWinnerView,
} from "@/lib/community/top-trader-types";
import type { TopTraderParticipantStatus } from "@/lib/community/top-trader-participant-service";
import { CommunityTopTraderDailyLeaders } from "@/components/community/community-top-trader-daily-leaders";
import { CommunityTopTraderDayFeed } from "@/components/community/community-top-trader-day-feed";
import { CommunityTopTraderProgramCard } from "@/components/community/community-top-trader-program-card";
import { CommunityTopTraderRankCard } from "@/components/community/community-top-trader-rank-card";
import { CommunityTopTraderTradeCard } from "@/components/community/community-top-trader-trade-card";
import { CommunityTopTraderWinnerStrip } from "@/components/community/community-top-trader-winner-strip";
import { CommunityTopTraderWeekHistory } from "@/components/community/community-top-trader-week-history";
import {
  CommunityTopTraderRankingToolbar,
  sortTopTraderEntries,
  type TopTraderRankingSort,
} from "@/components/community/community-top-trader-ranking-toolbar";
import { TopTraderEmptyIllustration } from "@/components/community/community-top-trader-illustrations";
import type { ListLimit } from "@/components/community/community-list-limit-control";
import { COMMUNITY_CARD } from "@/lib/community/community-ui";
import {
  capTopTraderDayGroups,
  groupFeedTradesByDay,
  groupUserTradesByDay,
} from "@/lib/community/top-trader-ui-helpers";
import { fetchAppApi } from "@/lib/client-app-fetch";

export function CommunityTopTraderPanel({
  fr,
  listLimit,
  onListLimitChange,
}: {
  fr: boolean;
  listLimit: ListLimit;
  onListLimitChange: (limit: ListLimit) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [program, setProgram] = useState<TopTraderProgramInfo | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<TopTraderProgramWeek | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<TopTraderProgramWeek[]>([]);
  const [weekHistory, setWeekHistory] = useState<TopTraderWeekHistoryEntry[]>([]);
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
  const [sort, setSort] = useState<TopTraderRankingSort>("rank");

  const weekFromUrl = searchParams.get("week");

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        limit: String(listLimit),
        historyLimit: "16",
      });
      if (weekFromUrl) q.set("weekStartAt", weekFromUrl);
      const res = await fetchAppApi(`/api/community/top-trader?${q.toString()}`);
      const j = await res.json();
      setProgram((j.program ?? null) as TopTraderProgramInfo | null);
      setSelectedWeek((j.selectedWeek ?? null) as TopTraderProgramWeek | null);
      setAvailableWeeks((j.availableWeeks ?? []) as TopTraderProgramWeek[]);
      setWeekHistory((j.weekHistory ?? []) as TopTraderWeekHistoryEntry[]);
      setTraders((j.traders ?? []) as TopTraderLeaderboardEntry[]);
      setViewer((j.viewer ?? null) as typeof viewer);
      setParticipant((j.participant ?? null) as TopTraderParticipantStatus | null);
      setLastWinner((j.lastWinner ?? null) as TopTraderWeekWinnerView | null);
    } finally {
      setLoading(false);
    }
  }, [listLimit, weekFromUrl]);

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent && !feedLoadedRef.current) setFeedLoading(true);
    try {
      const res = await fetchAppApi(
        `/api/community/top-trader/feed?limit=24&locale=${fr ? "fr" : "en"}`,
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
      const res = await fetchAppApi("/api/community/top-trader/trades?limit=15");
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

  const displayedTraders = useMemo(
    () => sortTopTraderEntries(traders, sort).slice(0, listLimit),
    [traders, sort, listLimit],
  );

  const feedGroups = useMemo(() => {
    if (!program || !feedTrades.length) return [];
    return capTopTraderDayGroups(groupFeedTradesByDay(feedTrades, program, fr));
  }, [feedTrades, program, fr]);

  const myTradeGroups = useMemo(
    () => capTopTraderDayGroups(groupUserTradesByDay(myTrades, fr), { maxDays: 2, maxTradesPerDay: 6 }),
    [myTrades, fr],
  );

  const expandedEntry = traders.find((t) => t.userId === expandedUserId) ?? null;
  const expandedTradeGroups = useMemo(
    () => capTopTraderDayGroups(groupUserTradesByDay(trades, fr), { maxDays: 2, maxTradesPerDay: 6 }),
    [trades, fr],
  );

  const selectWeek = (weekStartAt: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("week", weekStartAt);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

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
    return <p className="py-8 text-center text-sm text-stone-500">…</p>;
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

      {weekHistory.length > 0 && selectedWeek ? (
        <CommunityTopTraderWeekHistory
          fr={fr}
          entries={weekHistory}
          selectedWeekStartAt={selectedWeek.weekStartAt}
          onSelectWeek={selectWeek}
        />
      ) : null}

      {participant?.optedIn && viewer && selectedWeek?.isCurrent ? (
        <div className={`${COMMUNITY_CARD} flex items-center justify-between px-4 py-3`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
              {fr ? "Mon rang semaine" : "My week rank"}
            </p>
            <p className="text-2xl font-extrabold tabular-nums text-emerald-400">#{viewer.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
              {fr ? "PnL sem." : "Week PnL"}
            </p>
            <p
              className={`text-lg font-extrabold tabular-nums ${
                viewer.weeklyPnlUsdt >= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {viewer.weeklyPnlUsdt >= 0 ? "+" : ""}
              {viewer.weeklyPnlUsdt.toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-500">
              {viewer.tradeCount} {fr ? "trades" : "trades"}
            </p>
          </div>
        </div>
      ) : null}

      {dailyLeaders.length > 0 && selectedWeek?.isCurrent ? (
        <CommunityTopTraderDailyLeaders
          fr={fr}
          leaders={dailyLeaders}
          weekLeaderUserId={weekLeaderUserId}
        />
      ) : null}

      {selectedWeek?.isCurrent ? (
        <section>
          <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-stone-400">
            {fr ? "Activité compétition" : "Competition activity"}
          </h3>

          {feedLoading && !feedLoadedRef.current ? (
            <div className={`${COMMUNITY_CARD} h-24 animate-pulse`} aria-hidden />
          ) : feedTrades.length === 0 ? (
            <div className={`${COMMUNITY_CARD} flex flex-col items-center px-4 py-8 text-center`}>
              <TopTraderEmptyIllustration className="mb-3 h-20 w-20" />
              <p className="text-sm font-semibold text-stone-300">
                {fr ? "Aucun trade compétition" : "No competition trades yet"}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">
                {fr ? "Rejoignez · DEMO Futures" : "Join · DEMO Futures"}
              </p>
            </div>
          ) : (
            <CommunityTopTraderDayFeed fr={fr} groups={feedGroups} />
          )}
        </section>
      ) : null}

      {participant?.optedIn && myTrades.length > 0 && selectedWeek?.isCurrent ? (
        <section>
          <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-stone-400">
            {fr ? "Mes trades" : "My trades"}
          </h3>
          {myTradeGroups.map((g) => (
            <div key={g.dayKey} className="mb-3">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-stone-500">
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
        <h3 className="mb-2 px-0.5 text-xs font-extrabold uppercase tracking-wide text-stone-400">
          {selectedWeek?.isCurrent
            ? fr
              ? "Classement semaine"
              : "Weekly ranking"
            : fr
              ? `Classement · ${selectedWeek?.weekLabel ?? ""}`
              : `Ranking · ${selectedWeek?.weekLabel ?? ""}`}
        </h3>

        {selectedWeek && availableWeeks.length > 0 ? (
          <CommunityTopTraderRankingToolbar
            fr={fr}
            weeks={availableWeeks}
            selectedWeekStartAt={selectedWeek.weekStartAt}
            onWeekChange={selectWeek}
            sort={sort}
            onSortChange={setSort}
            listLimit={listLimit}
            onListLimitChange={onListLimitChange}
          />
        ) : null}

        {loading ? (
          <p className="py-6 text-center text-sm text-stone-500">…</p>
        ) : displayedTraders.length === 0 ? (
          <p className={`${COMMUNITY_CARD} py-6 text-center text-sm text-stone-500`}>
            {fr ? "Pas encore de classement." : "No ranking yet."}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayedTraders.map((entry, idx) => {
              const displayEntry =
                sort === "rank" ? entry : { ...entry, rank: idx + 1 };
              return (
              <li key={entry.userId}>
                <CommunityTopTraderRankCard
                  fr={fr}
                  entry={displayEntry}
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
                  <div className="mt-2 space-y-3 border-l-2 border-emerald-400/20 pl-3">
                    {tradesLoading ? (
                      <p className="py-4 text-center text-xs text-stone-500">…</p>
                    ) : trades.length === 0 ? (
                      <p className="py-2 text-center text-xs text-stone-500">-</p>
                    ) : (
                      expandedTradeGroups.map((g) => (
                        <div key={g.dayKey}>
                          <p className="mb-1.5 text-[10px] font-bold uppercase text-stone-500">
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
            );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
