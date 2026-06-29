"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { CommunityBotLeaderboardList } from "@/components/community/community-bot-leaderboard-list";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import { CommunityTopTraderPanel } from "@/components/community/community-top-trader-panel";
import { CommunityTraderRankCard } from "@/components/community/community-trader-rank-card";
import {
  CommunityListLimitControl,
  parseListLimit,
  type ListLimit,
} from "@/components/community/community-list-limit-control";
import { COMMUNITY_CARD } from "@/lib/community/community-ui";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";
import { fetchAppApi } from "@/lib/client-app-fetch";

type RankTab = "top_trader" | "contributors" | "trainers" | "analysts" | "bots";

const RANK_TABS = [
  { id: "top_trader" as const, labelFr: "Top Trader", labelEn: "Top Trader" },
  { id: "contributors" as const, labelFr: "Contributeurs", labelEn: "Contributors" },
  { id: "trainers" as const, labelFr: "Formateurs", labelEn: "Trainers" },
  { id: "analysts" as const, labelFr: "Analystes", labelEn: "Analysts" },
  { id: "bots" as const, labelFr: "Bots", labelEn: "Bots" },
];

function syncQuery(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  patch: Record<string, string | null>,
) {
  const next = new URLSearchParams(searchParams.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) next.delete(key);
    else next.set(key, value);
  }
  router.replace(`?${next.toString()}`, { scroll: false });
}

export function CommunityTradersClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<RankTab>(
    tabParam === "top_trader" ? "top_trader" : "contributors",
  );
  const [botBilling] = useState<"demo" | "live">("demo");
  const [traders, setTraders] = useState<TraderLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);
  const listLimit = parseListLimit(searchParams.get("limit"));

  useEffect(() => {
    if (tabParam === "top_trader") setTab("top_trader");
  }, [tabParam]);

  const setListLimit = useCallback(
    (limit: ListLimit) => {
      syncQuery(router, searchParams, { limit: String(limit) });
    },
    [router, searchParams],
  );

  const filtered = useMemo(() => {
    let list = traders;
    if (tab === "trainers") {
      list = traders.filter((t) =>
        t.badges.some((b) => b.slug === "mentor" || b.slug === "signal_pro"),
      );
    } else if (tab === "analysts") {
      list = [...traders].sort((a, b) => b.followerCount - a.followerCount);
    }
    return list.slice(0, listLimit);
  }, [tab, traders, listLimit]);

  const load = async () => {
    setLoading(true);
    try {
      const fetchLimit = tab === "trainers" ? 50 : Math.max(listLimit, 30);
      const res = await fetchAppApi(
        `/api/community/traders/leaderboard?limit=${fetchLimit}`,
      );
      const j = await res.json();
      setTraders((j.traders ?? []) as TraderLeaderboardEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "top_trader" && tab !== "bots") void load();
  }, [tab, listLimit]);

  const toggleFollow = async (handle: string, isFollowing: boolean) => {
    setBusyHandle(handle);
    try {
      const res = await fetch(`/api/community/traders/${handle}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });
      if (!res.ok) return;
      setTraders((list) =>
        list.map((t) =>
          t.handle === handle
            ? {
                ...t,
                isFollowing: !isFollowing,
                followerCount: t.followerCount + (isFollowing ? -1 : 1),
              }
            : t,
        ),
      );
    } finally {
      setBusyHandle(null);
    }
  };

  const subtitle =
    tab === "top_trader"
      ? fr
        ? "DEMO · PnL hebdo · 10 USDT"
        : "DEMO · Weekly PnL · 10 USDT"
      : tab === "bots"
        ? fr
          ? "Performance bots - copy des signaux TA+AI (vos clés)."
          : "Bot performance - copy TA+AI signals (your keys)."
        : fr
          ? "Réputation, signaux, traders."
          : "Reputation, signals, traders.";

  const handleTabChange = (next: RankTab) => {
    setTab(next);
    syncQuery(router, searchParams, {
      tab: next === "contributors" ? null : next,
    });
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Classement" : "Leaderboard"} />

      <CommunityFilterTabs tabs={RANK_TABS} active={tab} onChange={handleTabChange} fr={fr} />

      <p className="mb-3 mt-2 text-[11px] text-stone-500">{subtitle}</p>

      {tab === "top_trader" ? (
        <CommunityTopTraderPanel
          fr={fr}
          listLimit={listLimit}
          onListLimitChange={setListLimit}
        />
      ) : tab === "bots" ? (
        <>
          <div className="mb-3 flex justify-end">
            <CommunityListLimitControl
              value={listLimit}
              onChange={setListLimit}
              fr={fr}
            />
          </div>
          <CommunityBotLeaderboardList
            fr={fr}
            billing={botBilling}
            listLimit={listLimit}
            busyHandle={busyHandle}
            onFollow={(handle, isFollowing) => void toggleFollow(handle, isFollowing)}
          />
        </>
      ) : (
        <>
          <div className="mb-3 flex justify-end">
            <CommunityListLimitControl
              value={listLimit}
              onChange={setListLimit}
              fr={fr}
            />
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-stone-500">…</p>
          ) : filtered.length === 0 ? (
            <div className={`${COMMUNITY_CARD} px-4 py-8 text-center text-sm text-stone-400`}>
              {fr
                ? "Aucun trader classé pour l'instant. Publiez des signaux pour gagner en réputation."
                : "No ranked traders yet. Publish signals to build reputation."}
            </div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((t, idx) => (
                <li key={t.userId}>
                  <CommunityTraderRankCard
                    fr={fr}
                    rank={idx + 1}
                    entry={t}
                    busyFollow={busyHandle === t.handle}
                    onFollow={() => void toggleFollow(t.handle, t.isFollowing)}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
