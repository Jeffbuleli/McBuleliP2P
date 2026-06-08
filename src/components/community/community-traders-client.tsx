"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityRewardsCard } from "@/components/community/community-rewards-card";
import type { TraderLeaderboardEntry } from "@/lib/community/leaderboard-service";

export function CommunityTradersClient() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [traders, setTraders] = useState<TraderLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyHandle, setBusyHandle] = useState<string | null>(null);

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
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/app/community"
          className="text-sm font-semibold text-[#305f33]"
        >
          ← {fr ? "Communauté" : "Community"}
        </Link>
      </header>

      <h1 className="text-xl font-bold text-[#0c0a09]">
        {fr ? "Classement traders" : "Trader leaderboard"}
      </h1>
      <p className="mb-4 text-sm text-[#57534e]">
        {fr
          ? "Réputation, perf démo et signaux. Suivez pour préparer le copy trading."
          : "Reputation, demo performance and signals. Follow to prepare copy trading."}
      </p>

      <CommunityRewardsCard />

      {loading ? (
        <p className="py-8 text-center text-sm text-[#78716c]">…</p>
      ) : traders.length === 0 ? (
        <div className="fd-card px-4 py-8 text-center text-sm text-[#57534e]">
          {fr
            ? "Aucun trader classé pour l'instant. Publiez des signaux pour gagner en réputation."
            : "No ranked traders yet. Publish signals to build reputation."}
        </div>
      ) : (
        <ul className="space-y-3">
          {traders.map((t, idx) => (
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
                        <dt className="text-[#a8a29e]">PnL démo</dt>
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
                        {fr ? "Copy trading activé (bientôt)" : "Copy trading enabled (soon)"}
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
