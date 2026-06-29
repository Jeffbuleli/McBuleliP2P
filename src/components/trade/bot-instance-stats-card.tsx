"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { Messages } from "@/i18n/messages";
import { IconAnalysis } from "@/components/trade/bot-visual-icons";

export type BotStatsSnapshot = {
  runtimeDays: number;
  tradeCount: number;
  volumeUsdt: number;
  winCount: number;
  lossCount: number;
  winRate: number | null;
  avgClosePnlPct: number | null;
  skipCount: number;
  errorCount: number;
  lastTradeAt: string | null;
};

function StatCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "up" | "down" | "muted";
}) {
  const tone =
    accent === "up"
      ? "text-emerald-700"
      : accent === "down"
        ? "text-rose-700"
        : "text-[color:var(--fd-text)]";
  return (
    <div className="rounded-xl border border-[color:var(--fd-border)]/70 bg-white/90 px-2.5 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-extrabold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

export function BotInstanceStatsCard({
  planId,
  billing,
  t,
}: {
  planId: BotPlanId;
  billing: "demo" | "live";
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string;
}) {
  const [stats, setStats] = useState<BotStatsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ planId, billing });
      const res = await fetch(`/api/trade/bots/stats?${q}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.stats) {
        setStats(json.stats as BotStatsSnapshot);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [planId, billing]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 animate-pulse sm:grid-cols-4" aria-busy>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-stone-100" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const pnlAccent =
    stats.avgClosePnlPct == null
      ? undefined
      : stats.avgClosePnlPct >= 0
        ? "up"
        : "down";

  return (
    <div className="rounded-xl border border-[color:var(--fd-border)]/80 bg-gradient-to-br from-white to-[color:var(--fd-mint)]/25 p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--fd-primary)]/10 text-[color:var(--fd-primary)]">
          <IconAnalysis size={16} />
        </span>
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("bots_stats_title")}
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-lg border border-[color:var(--fd-border)] bg-white px-2 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)]"
        >
          ↻
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell
          label={t("bots_stats_trades")}
          value={String(stats.tradeCount)}
        />
        <StatCell
          label={t("bots_stats_runtime")}
          value={t("bots_stats_days", { days: String(stats.runtimeDays) })}
        />
        <StatCell
          label={t("bots_stats_volume")}
          value={`${stats.volumeUsdt}`}
        />
        <StatCell
          label={t("bots_stats_winrate")}
          value={
            stats.winRate != null ? `${stats.winRate}%` : "-"
          }
          accent={
            stats.winRate != null && stats.winRate >= 50 ? "up" : stats.winRate != null ? "down" : "muted"
          }
        />
      </div>
      {stats.avgClosePnlPct != null ? (
        <p className="mt-2 text-[11px] text-[color:var(--fd-muted)]">
          {t("bots_stats_avg_pnl")}:{" "}
          <span className={pnlAccent === "up" ? "font-bold text-emerald-700" : "font-bold text-rose-700"}>
            {stats.avgClosePnlPct > 0 ? "+" : ""}
            {stats.avgClosePnlPct}%
          </span>
        </p>
      ) : null}
    </div>
  );
}
