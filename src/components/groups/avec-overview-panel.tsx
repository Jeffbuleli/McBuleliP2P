"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecGauge, AvecProgressRing } from "@/components/groups/avec-charts";
import { IlluTreasury } from "@/components/groups/avec-illustrations";
import { AvecVueGovernanceCard } from "@/components/groups/avec-vue-governance-card";
import { AvecAiInsightsCard } from "@/components/groups/avec-ai-insights-card";
import { AvecFinancialPassportPanel } from "@/components/groups/avec-financial-passport-panel";
import { AvecMemberQuickActions } from "@/components/groups/avec-member-quick-actions";
import { avecCls } from "@/components/groups/avec-ui";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";

type FundBuckets = {
  savingsUsdt: number;
  socialUsdt: number;
  penaltiesUsdt?: number;
  interestUsdt?: number;
  reserveUsdt?: number;
  lentUsdt: number;
  creditUsdt?: number;
  availableUsdt: number;
};

function cycleProgressPct(createdAt: string, cycleDays: number): number {
  const start = new Date(createdAt).getTime();
  const elapsed = Date.now() - start;
  const total = cycleDays * 86400000;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function AvecOverviewPanel({
  groupId,
  group,
  memberCount,
  members,
  pendingCount,
  myUserId,
  canModerate,
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
    cycleStatus?: string;
    cycleNumber?: number;
  };
  memberCount: number;
  members: AvecMemberRow[];
  pendingCount: number;
  myUserId?: string;
  canModerate?: boolean;
  canAdmin?: boolean;
  onNavigate: (tab: "meeting" | "members" | "treasury" | "dialogue") => void;
}) {
  const { t } = useI18n();
  const [funds, setFunds] = useState<FundBuckets | null>(null);
  const [openVote, setOpenVote] = useState<GovernanceVoteMeta | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState(0);

  const loadGov = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const list = (j.proposals ?? []) as GovernanceVoteMeta[];
    setOpenVote(list.find((p) => p.status === "voting") ?? null);
  }, [groupId]);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/groups/${groupId}/funds`, { cache: "no-store" }),
      loadGov(),
    ])
      .then(async ([f]) => {
        const fj = await f.json().catch(() => ({}));
        if (fj.funds) setFunds(fj.funds as FundBuckets);
      })
      .catch(() => {});

    if (canModerate) {
      void fetch(`/api/groups/${groupId}/payouts`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          setPendingPayouts(Array.isArray(j.pending) ? j.pending.length : 0);
        })
        .catch(() => {});
    }
  }, [groupId, canModerate, loadGov]);

  const cyclePct = cycleProgressPct(group.createdAt, group.cycleDurationDays);
  const pending = members.filter((m) => m.status === "pending").length;
  const bucketMax = funds
    ? Math.max(
        funds.savingsUsdt,
        funds.socialUsdt,
        funds.penaltiesUsdt ?? 0,
        funds.interestUsdt ?? 0,
        funds.lentUsdt,
        1,
      )
    : 1;

  const buckets = useMemo(() => {
    if (!funds) return [];
    return [
      { label: t("avec_fund_savings"), val: funds.savingsUsdt, color: "var(--fd-primary)" },
      { label: t("avec_fund_social"), val: funds.socialUsdt, color: "#0d9488" },
      {
        label: t("avec_fund_credit_short"),
        val: funds.creditUsdt ?? funds.lentUsdt,
        color: "#7c3aed",
      },
    ];
  }, [funds, t]);

  return (
    <div className="space-y-3">
      {/* 1. Pulse - what the group holds */}
      <div className={`${avecCls.section} space-y-3`}>
        <div className="flex items-center gap-2">
          <IlluTreasury className="h-10 w-14 shrink-0 text-[color:var(--fd-primary)]" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("avec_vue_treasury")}
            </p>
            <p className="text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {(funds?.availableUsdt ?? group.balanceUsdt).toFixed(0)}
              <span className="ml-1 text-xs font-bold">USDT</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center rounded-xl bg-[color:var(--fd-bg)] py-2">
            <AvecGauge value={cyclePct} max={100} label={`${cyclePct}%`} />
            <p className="mt-1 text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_vue_cycle")} #{group.cycleNumber ?? 1}
            </p>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-[color:var(--fd-bg)] py-2">
            <AvecProgressRing value={memberCount} max={group.maxMembers} size={56} />
            <p className="mt-1 text-base font-black tabular-nums">
              {memberCount}
              <span className="text-[10px] font-semibold text-[color:var(--fd-muted)]">
                /{group.maxMembers}
              </span>
            </p>
            <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("avec_vue_members")}
            </p>
            {pending > 0 ? (
              <p className="text-[8px] text-amber-800">
                +{pending} {t("avec_vue_pending_short")}
              </p>
            ) : null}
          </div>
        </div>

        {buckets.length > 0 ? (
          <div className="flex items-end justify-around gap-2 pt-1">
            {buckets.map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-8 rounded-t-md"
                  style={{
                    height: `${Math.max(8, (b.val / bucketMax) * 40)}px`,
                    backgroundColor: b.color,
                    opacity: 0.8,
                  }}
                />
                <p className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">{b.label}</p>
                <p className="font-mono text-[10px] font-bold tabular-nums">{b.val.toFixed(0)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* 2. Live vote - one card only */}
      {openVote ? (
        <AvecVueGovernanceCard
          groupId={groupId}
          myUserId={myUserId}
          meta={openVote}
          onVoted={() => void loadGov()}
        />
      ) : null}

      {/* 3. Do - same names as tabs, big SVGs */}
      <div>
        <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_do_title")}
        </p>
        <AvecMemberQuickActions
          onGoMeeting={() => onNavigate("meeting")}
          onGoTreasury={() => onNavigate("treasury")}
          onGoDialogue={() => onNavigate("dialogue")}
          voteLive={!!openVote}
        />
      </div>

      {/* 4. Me + tip */}
      {myUserId ? (
        <div id="avec-passport">
          <AvecFinancialPassportPanel groupId={groupId} compact />
        </div>
      ) : null}

      <AvecAiInsightsCard groupId={groupId} />

      {/* 5. Alerts only */}
      <div className="flex flex-wrap gap-2">
        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={() => onNavigate("members")}
            className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            {pendingCount} - {t("avec_vue_members")}
          </button>
        ) : null}
        {pendingPayouts > 0 && canModerate ? (
          <button
            type="button"
            onClick={() => onNavigate("treasury")}
            className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold text-violet-900 ring-1 ring-violet-300"
          >
            {pendingPayouts} - {t("avec_tab_treasury")}
          </button>
        ) : null}
        {group.subscriptionStatus === "overdue" ? (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-bold text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            {t("avec_vue_alert_sub")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
