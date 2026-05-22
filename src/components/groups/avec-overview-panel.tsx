"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AvecBarChart,
  AvecDonut,
  AvecGauge,
  AvecHorizontalBars,
} from "@/components/groups/avec-charts";
import { AvecHeroIllustration, AvecIconCycle } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";

type LedgerRow = {
  entryType: string;
  amount: string;
  createdAt: string;
};

function cycleProgressPct(createdAt: string, cycleDays: number): number {
  const start = new Date(createdAt).getTime();
  const elapsed = Date.now() - start;
  const total = cycleDays * 86400000;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function weeklyContributionBars(ledger: LedgerRow[], weeks = 8): number[] {
  const contrib = ledger.filter((e) => e.entryType === "group_contribution_in");
  const bars = Array.from({ length: weeks }, () => 0);
  const now = Date.now();
  for (const e of contrib) {
    const age = now - new Date(e.createdAt).getTime();
    const w = Math.floor(age / (7 * 86400000));
    if (w >= 0 && w < weeks) {
      bars[weeks - 1 - w] += Number(e.amount) || 0;
    }
  }
  return bars;
}

export function AvecOverviewPanel({
  groupId,
  group,
  memberCount,
  members,
  pendingCount,
  onNavigate,
}: {
  groupId: string;
  group: {
    balanceUsdt: number;
    contributionAmountUsdt: string;
    cycleDurationDays: number;
    meetingIntervalDays: number;
    maxMembers: number;
    socialFundUsdt: string;
    createdAt: string;
    subscriptionStatus: string;
    status: string;
  };
  memberCount: number;
  members: AvecMemberRow[];
  pendingCount: number;
  onNavigate: (tab: "meeting" | "members") => void;
}) {
  const { t } = useI18n();
  const [ledger, setLedger] = useState<LedgerRow[]>([]);

  useEffect(() => {
    void fetch(`/api/groups/${groupId}/activity`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j.ledger) setLedger(j.ledger as LedgerRow[]);
      })
      .catch(() => {});
  }, [groupId]);

  const cyclePct = cycleProgressPct(group.createdAt, group.cycleDurationDays);
  const weeklyBars = useMemo(() => weeklyContributionBars(ledger), [ledger]);
  const totalSaved = members.reduce((s, m) => s + (m.savedUsdt ?? 0), 0);

  const topSavers = useMemo(() => {
    const max = Math.max(...members.map((m) => m.savedUsdt ?? 0), 1);
    return [...members]
      .filter((m) => m.status === "approved")
      .sort((a, b) => (b.savedUsdt ?? 0) - (a.savedUsdt ?? 0))
      .slice(0, 4)
      .map((m) => ({
        label: p2pDisplayName({
          email: m.email,
          displayName: m.displayName ?? null,
          avatarUrl: null,
          piUsername: null,
        }),
        value: m.savedUsdt ?? 0,
        max,
      }));
  }, [members]);

  const approved = members.filter((m) => m.status === "approved").length;
  const pending = members.filter((m) => m.status === "pending").length;

  return (
    <div className="space-y-3">
      <div className={`${avecCls.section} relative overflow-hidden`}>
        <div className="flex items-center gap-3">
          <span className="text-[color:var(--fd-primary)] opacity-90">
            <AvecHeroIllustration className="h-14 w-14" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("avec_vue_treasury")}
            </p>
            <p className="text-3xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {group.balanceUsdt.toFixed(0)}
              <span className="ml-1 text-sm font-bold">USDT</span>
            </p>
            <p className="text-[10px] text-[color:var(--fd-muted)]">
              {t("avec_vue_saved_members", { amount: totalSaved.toFixed(0) })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`${avecCls.section} flex flex-col items-center py-3`}>
          <AvecIconCycle className="mb-1 h-5 w-5 text-[color:var(--fd-primary)]" />
          <AvecGauge value={cyclePct} max={100} label={`${cyclePct}%`} />
          <p className="mt-1 text-center text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_vue_cycle")}
          </p>
        </div>

        <div className={`${avecCls.section} flex flex-col items-center py-3`}>
          <AvecDonut
            size={72}
            segments={[
              { value: approved, color: "var(--fd-primary)" },
              { value: pending || 0.001, color: "#d6d3d1" },
            ]}
          />
          <p className="mt-2 text-center text-lg font-black text-[color:var(--fd-text)]">
            {memberCount}
            <span className="text-[10px] font-bold text-[color:var(--fd-muted)]">
              /{group.maxMembers}
            </span>
          </p>
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_vue_members")}
          </p>
        </div>

        <div className={`${avecCls.section} col-span-2`}>
          <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("avec_vue_contrib_trend")}
          </p>
          <AvecBarChart values={weeklyBars} />
          <p className="mt-1 text-center text-[9px] text-[color:var(--fd-muted)]">
            {t("avec_vue_weeks_ago")}
          </p>
        </div>

        {topSavers.length > 0 ? (
          <div className={`${avecCls.section} col-span-2`}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("avec_vue_top_savers")}
            </p>
            <AvecHorizontalBars items={topSavers} />
          </div>
        ) : null}
      </div>

      {(pendingCount > 0 || group.subscriptionStatus === "overdue") && (
        <div className="flex flex-wrap gap-2">
          {pendingCount > 0 ? (
            <button
              type="button"
              onClick={() => onNavigate("members")}
              className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300"
            >
              {t("avec_vue_alert_pending", { count: pendingCount })}
            </button>
          ) : null}
          {group.subscriptionStatus === "overdue" ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-bold text-rose-800 ring-1 ring-rose-300">
              {t("avec_vue_alert_sub")}
            </span>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavigate("meeting")}
          className="rounded-xl border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] py-3 text-xs font-bold text-[color:var(--fd-primary)]"
        >
          {t("avec_vue_go_meeting")}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("members")}
          className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-3 text-xs font-bold text-[color:var(--fd-text)]"
        >
          {t("avec_vue_go_members")}
        </button>
      </div>
    </div>
  );
}
