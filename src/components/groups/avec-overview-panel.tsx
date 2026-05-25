"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AvecBarChart,
  AvecDonut,
  AvecGauge,
  AvecHorizontalBars,
} from "@/components/groups/avec-charts";
import {
  IlluActivityFlow,
  IlluCollectiveVote,
  IlluTreasury,
} from "@/components/groups/avec-illustrations";
import { AvecVueGovernanceCard } from "@/components/groups/avec-vue-governance-card";
import { avecCls } from "@/components/groups/avec-ui";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";

type LedgerRow = {
  entryType: string;
  amount: string;
  createdAt: string;
};

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

function ledgerFlowBars(ledger: LedgerRow[]): { in: number; out: number } {
  let inn = 0;
  let out = 0;
  for (const e of ledger.slice(0, 80)) {
    const n = Number(e.amount) || 0;
    if (n >= 0) inn += n;
    else out += Math.abs(n);
  }
  return { in: inn, out: out };
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
  onNavigate: (tab: "meeting" | "members" | "treasury" | "dialogue") => void;
}) {
  const { t } = useI18n();
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
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
    const voting = list.find((p) => p.status === "voting");
    setOpenVote(voting ?? null);
  }, [groupId]);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/groups/${groupId}/activity`, { cache: "no-store" }),
      fetch(`/api/groups/${groupId}/funds`, { cache: "no-store" }),
      loadGov(),
    ])
      .then(async ([a, f]) => {
        const aj = await a.json().catch(() => ({}));
        if (aj.ledger) setLedger(aj.ledger as LedgerRow[]);
        const fj = await f.json().catch(() => ({}));
        if (fj.funds) setFunds(fj.funds as FundBuckets);
      })
      .catch(() => {});

    if (canModerate) {
      void fetch(`/api/groups/${groupId}/payouts`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => {
          const n = Array.isArray(j.pending) ? j.pending.length : 0;
          setPendingPayouts(n);
        })
        .catch(() => {});
    }
  }, [groupId, canModerate, loadGov]);

  const cyclePct = cycleProgressPct(group.createdAt, group.cycleDurationDays);
  const weeklyBars = useMemo(() => weeklyContributionBars(ledger), [ledger]);
  const flow = useMemo(() => ledgerFlowBars(ledger), [ledger]);
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

  return (
    <div className="space-y-3">
      {openVote ? (
        <AvecVueGovernanceCard
          groupId={groupId}
          myUserId={myUserId}
          meta={openVote}
          onVoted={() => void loadGov()}
        />
      ) : null}

      <div className={`${avecCls.section} relative overflow-hidden`}>
        <div className="absolute -right-2 -top-2 opacity-[0.12] text-[color:var(--fd-primary)]">
          <IlluTreasury className="h-24 w-28" />
        </div>
        <div className="relative flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
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
          {funds ? (
            <p className="text-right text-[10px] font-bold tabular-nums text-[color:var(--fd-primary)]">
              {t("avec_fund_available")}
              <br />
              {funds.availableUsdt.toFixed(0)}
            </p>
          ) : null}
        </div>
      </div>

      {funds ? (
        <div className={`${avecCls.section}`}>
          <p className="mb-2 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("avec_vue_fund_buckets")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t("avec_fund_savings"), val: funds.savingsUsdt, color: "var(--fd-primary)" },
              { label: t("avec_fund_social"), val: funds.socialUsdt, color: "#0d9488" },
              ...(funds.penaltiesUsdt && funds.penaltiesUsdt > 0.01
                ? [{ label: t("avec_fund_penalties"), val: funds.penaltiesUsdt, color: "#ea580c" }]
                : []),
              ...(funds.interestUsdt && funds.interestUsdt > 0.01
                ? [{ label: t("avec_fund_interest"), val: funds.interestUsdt, color: "#0891b2" }]
                : []),
              {
                label: t("avec_fund_credit_short"),
                val: funds.creditUsdt ?? funds.lentUsdt,
                color: "#7c3aed",
              },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center gap-1">
                <div
                  className="w-full max-w-[48px] rounded-t-md"
                  style={{
                    height: `${Math.max(8, (b.val / bucketMax) * 48)}px`,
                    backgroundColor: b.color,
                    opacity: 0.75,
                  }}
                />
                <p className="text-center text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
                  {b.label}
                </p>
                <p className="font-mono text-[10px] font-bold tabular-nums">{b.val.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className={`${avecCls.section} flex flex-col items-center py-2`}>
          <AvecGauge value={cyclePct} max={100} label={`${cyclePct}%`} />
          <p className="mt-1 text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_vue_cycle")} #{group.cycleNumber ?? 1}
          </p>
        </div>

        <div className={`${avecCls.section} flex flex-col items-center py-2`}>
          <AvecDonut
            size={64}
            segments={[
              { value: approved, color: "var(--fd-primary)" },
              { value: pending || 0.001, color: "#d6d3d1" },
            ]}
          />
          <p className="mt-1 text-lg font-black">
            {memberCount}
            <span className="text-[10px] text-[color:var(--fd-muted)]">/{group.maxMembers}</span>
          </p>
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_vue_members")}
          </p>
        </div>

        <div className={`${avecCls.section} col-span-2`}>
          <div className="mb-2 flex items-center gap-2">
            <IlluActivityFlow className="h-10 w-14 shrink-0 text-[color:var(--fd-primary)] opacity-70" />
            <p className="text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("avec_vue_contrib_trend")}
            </p>
          </div>
          <AvecBarChart values={weeklyBars} />
        </div>

        <div className={`${avecCls.section} col-span-2`}>
          <p className="mb-2 text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_vue_flow")}
          </p>
          <div className="flex h-12 items-end justify-center gap-6">
            <div className="flex flex-col items-center">
              <div
                className="w-10 rounded-t-md bg-emerald-500/80"
                style={{
                  height: `${Math.max(6, (flow.in / Math.max(flow.in, flow.out, 1)) * 40)}px`,
                }}
              />
              <span className="mt-1 text-[8px] font-bold text-emerald-800">{t("avec_vue_in")}</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className="w-10 rounded-t-md bg-rose-400/80"
                style={{
                  height: `${Math.max(6, (flow.out / Math.max(flow.in, flow.out, 1)) * 40)}px`,
                }}
              />
              <span className="mt-1 text-[8px] font-bold text-rose-800">{t("avec_vue_out")}</span>
            </div>
          </div>
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

      <div className="flex flex-wrap gap-2">
        {pendingCount > 0 ? (
          <button
            type="button"
            onClick={() => onNavigate("members")}
            className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300"
          >
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            {pendingCount}
          </button>
        ) : null}
        {pendingPayouts > 0 && canModerate ? (
          <button
            type="button"
            onClick={() => onNavigate("treasury")}
            className="flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-[10px] font-bold text-violet-900 ring-1 ring-violet-300"
          >
            <IlluCollectiveVote className="h-4 w-6" />
            {pendingPayouts}
          </button>
        ) : null}
        {group.subscriptionStatus === "overdue" ? (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1.5 text-[10px] font-bold text-rose-800">
            <span className="h-2 w-2 rounded-full bg-rose-600" />
            {t("avec_vue_alert_sub")}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavigate("meeting")}
          className="rounded-xl border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] py-3 text-[10px] font-bold uppercase text-[color:var(--fd-primary)]"
        >
          {t("avec_vue_go_meeting")}
        </button>
        <button
          type="button"
          onClick={() => onNavigate("dialogue")}
          className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-3 text-[10px] font-bold uppercase text-[color:var(--fd-text)]"
        >
          {t("avec_vue_go_dialogue")}
        </button>
      </div>
    </div>
  );
}
