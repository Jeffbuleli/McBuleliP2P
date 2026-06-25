"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityBotLeaderboardList } from "@/components/community/community-bot-leaderboard-list";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";

type RankTab = "contributors" | "trainers" | "analysts" | "bots";

const RANK_TABS = [
  { id: "contributors" as const, labelFr: "Contributeurs", labelEn: "Contributors" },
  { id: "trainers" as const, labelFr: "Formateurs", labelEn: "Trainers" },
  { id: "analysts" as const, labelFr: "Analystes", labelEn: "Analysts" },
  { id: "bots" as const, labelFr: "Bots", labelEn: "Bots" },
];

export function CommunityTradersClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [tab, setTab] = useState<RankTab>("contributors");
  const [botBilling] = useState<"demo" | "live">("demo");
  const [traders, setTraders] = useState<TraderLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "trainers") {
      return traders.filter((t) =>
        t.badges.some((b) => b.slug === "mentor" || b.slug === "signal_pro"),
      );
    }
    if (tab === "analysts") {
      return [...traders].sort((a, b) => b.followerCount - a.followerCount);
    }
    return traders;
  }, [tab, traders]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/community/traders/leaderboard");
      const j = await res.json();
      setTraders((j.traders ?? []) as TraderLeaderboardEntry[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

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

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <CommunityModuleHeader title={fr ? "Classement" : "Leaderboard"} />

      <CommunityFilterTabs tabs={RANK_TABS} active={tab} onChange={setTab} fr={fr} />

      <p className="mb-3 mt-2 text-[11px] text-[#78716c]">
        {tab === "bots"
          ? fr
            ? "Performance bots — copy des signaux TA+AI (vos clés)."
            : "Bot performance — copy TA+AI signals (your keys)."
          : fr
            ? "Réputation, signaux, traders."
            : "Reputation, signals, traders."}
      </p>

      {tab === "bots" ? (
        <CommunityBotLeaderboardList
          fr={fr}
          billing={botBilling}
          busyHandle={busyHandle}
          onFollow={(handle, isFollowing) => void toggleFollow(handle, isFollowing)}
        />
      ) : loading ? (
        <p className="py-8 text-center text-sm text-[#78716c]">…</p>
      ) : filtered.length === 0 ? (
        <div className="fd-card px-4 py-8 text-center text-sm text-[#57534e]">
          {fr
            ? "Aucun trader classé pour l'instant. Publiez des signaux pour gagner en réputation."
            : "No ranked traders yet. Publish signals to build reputation."}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((t, idx) => (
            <li key={t.userId}>
              <article className="fd-card px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f3ee] text-sm font-bold text-[#305f33]">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0c0a09]">
                      {t.displayName}
                      {t.showKycBadge ? (
                        <span className="ml-1 text-[10px] text-[#305f33]">✓</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-[#78716c]">@{t.handle}</p>
                    {t.badges.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.badges.map((b) => (
                          <span
                            key={b.slug}
                            className="rounded-full bg-[#fafaf9] px-2 py-0.5 text-[10px] font-medium text-[#57534e]"
                          >
                            {fr ? b.labelFr : b.labelEn}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <dt className="text-[#a8a29e]">
                          {fr ? "Réputation" : "Reputation"}
                        </dt>
                        <dd className="font-semibold text-[#0c0a09]">
                          {t.reputationScore}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#a8a29e]">
                          {fr ? "Abonnés" : "Followers"}
                        </dt>
                        <dd className="font-semibold text-[#0c0a09]">
                          {t.followerCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[#a8a29e]">
                          {fr ? "PnL démo" : "Demo PnL"}
                        </dt>
                        <dd
                          className={`font-semibold ${
                            t.demoPnlUsdt >= 0
                              ? "text-[#305f33]"
                              : "text-[#b45309]"
                          }`}
                        >
                          {t.demoPnlUsdt >= 0 ? "+" : ""}
                          {t.demoPnlUsdt.toFixed(2)} USDT
                        </dd>
                      </div>
                      {t.livePnlUsdt !== 0 ? (
                        <div>
                          <dt className="text-[#a8a29e]">
                            {fr ? "PnL réel" : "Live PnL"}
                          </dt>
                          <dd
                            className={`font-semibold ${
                              t.livePnlUsdt >= 0
                                ? "text-[#305f33]"
                                : "text-[#b45309]"
                            }`}
                          >
                            {t.livePnlUsdt >= 0 ? "+" : ""}
                            {t.livePnlUsdt.toFixed(2)} USDT
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-[#a8a29e]">
                          {fr ? "Signaux" : "Signals"}
                        </dt>
                        <dd className="font-semibold text-[#0c0a09]">
                          {t.openSignals} {fr ? "ouv." : "open"}
                          {t.signalWinRate != null
                            ? ` · ${t.signalWinRate}%`
                            : ""}
                        </dd>
                      </div>
                    </dl>
                    {t.copyTradingEnabled ? (
                      <p className="mt-1 text-[10px] font-medium text-[#305f33]">
                        {fr ? "Copy trading activé" : "Copy trading enabled"}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busyHandle === t.handle}
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${
                      t.isFollowing
                        ? "border border-[#d6d3d1] text-[#57534e]"
                        : "bg-[#305f33] text-white"
                    } disabled:opacity-50`}
                    onClick={() => void toggleFollow(t.handle, t.isFollowing)}
                  >
                    {t.isFollowing
                      ? fr
                        ? "Suivi"
                        : "Following"
                      : fr
                        ? "Suivre"
                        : "Follow"}
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
