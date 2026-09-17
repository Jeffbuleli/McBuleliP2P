"use client";

import { avecMoney } from "@/lib/avec/display-currency";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecProgressRing } from "@/components/groups/avec-charts";
import { AvecVueGovernanceCard } from "@/components/groups/avec-vue-governance-card";
import { AvecAiInsightsCard } from "@/components/groups/avec-ai-insights-card";
import { AvecFinancialPassportPanel } from "@/components/groups/avec-financial-passport-panel";
import { EavecEconomicCycleStrip } from "@/components/eavec-market/market-ui";
import {
  avecCls,
  AvecFeedRow,
  AvecMoneyNote,
} from "@/components/groups/avec-ui";
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

type LedgerEntry = {
  id: string;
  entryType: string;
  amount: string;
  createdAt: string;
  meta?: Record<string, unknown> | null;
};

function cycleProgressPct(createdAt: string, cycleDays: number): number {
  const start = new Date(createdAt).getTime();
  const elapsed = Date.now() - start;
  const total = cycleDays * 86400000;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function entryLabel(
  entryType: string,
  labels: {
    contribution: string;
    loan: string;
    social: string;
    payout: string;
    movement: string;
  },
): string {
  if (entryType.includes("contribution")) return labels.contribution;
  if (entryType.includes("loan")) return labels.loan;
  if (entryType.includes("social") || entryType.includes("aid"))
    return labels.social;
  if (entryType.includes("payout")) return labels.payout;
  return labels.movement;
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
  const { t, locale } = useI18n();
  const [funds, setFunds] = useState<FundBuckets | null>(null);
  const [openVote, setOpenVote] = useState<GovernanceVoteMeta | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [feed, setFeed] = useState<LedgerEntry[]>([]);
  const [showMore, setShowMore] = useState(false);

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
      fetch(`/api/groups/${groupId}/activity`, { cache: "no-store" }),
      loadGov(),
    ])
      .then(async ([f, a]) => {
        const fj = await f.json().catch(() => ({}));
        if (fj.funds) setFunds(fj.funds as FundBuckets);
        const aj = await a.json().catch(() => ({}));
        if (Array.isArray(aj.ledger)) {
          setFeed((aj.ledger as LedgerEntry[]).slice(0, 5));
        }
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
  const me = members.find((m) => m.userId === myUserId);
  const myShares = Number(me?.sharesTotal ?? 0) || 0;
  const shareValue = Number(group.contributionAmountUsdt) || 0;
  const socialPer = Number(group.socialFundUsdt) || 0;
  const nextMeetingTotal = shareValue + socialPer;
  const treasury = funds?.availableUsdt ?? group.balanceUsdt;
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const alerts = useMemo(() => {
    const items: {
      key: string;
      label: string;
      tone: string;
      onClick?: () => void;
    }[] = [];
    if (openVote) {
      items.push({
        key: "vote",
        label: t("avec_vue_vote_live"),
        tone: "bg-violet-100 text-violet-900 ring-violet-300",
        onClick: () => onNavigate("dialogue"),
      });
    }
    if (pendingCount > 0) {
      items.push({
        key: "pending",
        label: `${pendingCount} - ${t("avec_vue_members")}`,
        tone: "bg-amber-100 text-amber-900 ring-amber-300",
        onClick: () => onNavigate("members"),
      });
    }
    if (pendingPayouts > 0 && canModerate) {
      items.push({
        key: "payout",
        label: `${pendingPayouts} - ${t("avec_tab_treasury")}`,
        tone: "bg-sky-100 text-sky-900 ring-sky-300",
        onClick: () => onNavigate("treasury"),
      });
    }
    if (group.subscriptionStatus === "overdue") {
      items.push({
        key: "sub",
        label: t("avec_vue_alert_sub"),
        tone: "bg-rose-100 text-rose-800 ring-rose-300",
      });
    }
    return items;
  }, [
    openVote,
    pendingCount,
    pendingPayouts,
    canModerate,
    group.subscriptionStatus,
    onNavigate,
    t,
  ]);

  return (
    <div className="space-y-3">
      <div className={avecCls.layoutVue}>
        <div className={avecCls.heroBalance}>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
            {t("avec_vue_treasury")}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-tight">
            {avecMoney(treasury)}
          </p>
          <AvecMoneyNote>
            <span className="text-white/65">{t("avec_money_ledger_note")}</span>
          </AvecMoneyNote>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase text-white/65">
                {t("avec_vue_cycle")} #{group.cycleNumber ?? 1}
              </p>
              <p className="mt-1 text-xl font-black tabular-nums">{cyclePct}%</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${cyclePct}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <p className="text-[9px] font-bold uppercase text-white/65">
                {t("avec_vue_members")}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <AvecProgressRing value={memberCount} max={group.maxMembers} size={44} />
                <p className="text-lg font-black tabular-nums">
                  {memberCount}
                  <span className="text-xs font-semibold text-white/60">
                    /{group.maxMembers}
                  </span>
                </p>
              </div>
              {pending > 0 ? (
                <p className="mt-0.5 text-[9px] text-amber-200">
                  +{pending} {t("avec_vue_pending_short")}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={avecCls.checkoutCard}>
            <p className={avecCls.sectionTitle}>{t("avec_vue_next_action")}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {avecMoney(nextMeetingTotal)}
            </p>
            <p className="mt-1 text-[11px] text-[color:var(--fd-muted)]">
              {t("avec_vue_next_action_hint", {
                share: avecMoney(shareValue),
                social: avecMoney(socialPer),
              })}
            </p>
            <button
              type="button"
              onClick={() => onNavigate("meeting")}
              className={`${avecCls.btnPrimary} mt-3`}
            >
              {t("avec_vue_cta_contribute")}
            </button>
            {myUserId ? (
              <p className="mt-2 text-[11px] font-semibold text-[color:var(--fd-muted)]">
                {t("avec_vue_my_shares")}:{" "}
                <span className="text-[color:var(--fd-text)]">{myShares}</span>
                {" · "}
                {t("avec_vue_my_position")}:{" "}
                <span className="tabular-nums text-[color:var(--fd-primary)]">
                  {avecMoney(myShares * shareValue)}
                </span>
              </p>
            ) : null}
          </div>

          {alerts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alerts.map((a) =>
                a.onClick ? (
                  <button
                    key={a.key}
                    type="button"
                    onClick={a.onClick}
                    className={`${avecCls.alertChip} ${a.tone}`}
                  >
                    {a.label}
                  </button>
                ) : (
                  <span key={a.key} className={`${avecCls.alertChip} ${a.tone}`}>
                    {a.label}
                  </span>
                ),
              )}
            </div>
          ) : null}
        </div>
      </div>

      {openVote ? (
        <AvecVueGovernanceCard
          groupId={groupId}
          myUserId={myUserId}
          meta={openVote}
          onVoted={() => void loadGov()}
        />
      ) : null}

      <div className={avecCls.section}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className={avecCls.sectionTitle}>{t("avec_vue_recent")}</p>
          <button
            type="button"
            onClick={() => onNavigate("treasury")}
            className="text-[10px] font-bold text-[color:var(--fd-primary)]"
          >
            {t("avec_vue_see_all")}
          </button>
        </div>
        {feed.length === 0 ? (
          <p className="py-3 text-center text-xs text-[color:var(--fd-muted)]">
            {t("avec_vue_feed_empty")}
          </p>
        ) : (
          feed.map((e) => (
            <AvecFeedRow
              key={e.id}
              title={entryLabel(e.entryType, {
                contribution: t("avec_feed_contribution"),
                loan: t("avec_feed_loan"),
                social: t("avec_feed_social"),
                payout: t("avec_feed_payout"),
                movement: t("avec_feed_movement"),
              })}
              meta={new Date(e.createdAt).toLocaleString(loc, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
              amount={avecMoney(e.amount)}
            />
          ))
        )}
      </div>

      {myUserId ? (
        <div className={avecCls.section} id="avec-me">
          <p className={avecCls.sectionTitle}>{t("avec_vue_me_title")}</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <AvecKpiLocal label={t("avec_vue_my_shares")} value={String(myShares)} />
            <AvecKpiLocal
              label={t("avec_vue_my_position")}
              value={avecMoney(myShares * shareValue)}
            />
            <button
              type="button"
              onClick={() => onNavigate("treasury")}
              className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-2 py-2 text-center text-[10px] font-bold text-[color:var(--fd-primary)]"
            >
              {t("avec_vue_my_loans_cta")}
            </button>
          </div>
          <div className="mt-3" id="avec-passport">
            <AvecFinancialPassportPanel groupId={groupId} compact />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="w-full text-center text-[11px] font-bold text-[color:var(--fd-muted)] underline"
      >
        {showMore ? t("avec_vue_less") : t("avec_vue_more")}
      </button>

      {showMore ? (
        <div className="space-y-3">
          <EavecEconomicCycleStrip locale={locale} />
          <AvecAiInsightsCard groupId={groupId} />
        </div>
      ) : null}
    </div>
  );
}

function AvecKpiLocal({ label, value }: { label: string; value: string }) {
  return (
    <div className={avecCls.kpi}>
      <p className={avecCls.kpiLabel}>{label}</p>
      <p className={`${avecCls.kpiValue} !text-sm`}>{value}</p>
    </div>
  );
}
