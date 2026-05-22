"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecChatroom } from "@/components/groups/avec-chatroom";
import { AvecIconMembers, AvecIconShares, AvecIconTreasury } from "@/components/groups/avec-icons";
import { AvecMemberList, type AvecMemberRow } from "@/components/groups/avec-member-list";
import { AvecPayoutPanel } from "@/components/groups/avec-payout-panel";
import { AvecReportsPanel } from "@/components/groups/avec-reports-panel";
import { AvecRoleStrip } from "@/components/groups/avec-role-strip";
import { AvecTopBar } from "@/components/groups/avec-top-bar";
import { AvecKpi, avecCls } from "@/components/groups/avec-ui";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { daysUntil, isReminderDay } from "@/lib/group-savings-reminders";
import { countryLabel } from "@/lib/country-label";
import { clientErrorText } from "@/lib/client-error-text";

type Dashboard = {
  ok: true;
  group: {
    id: string;
    name: string;
    countryCode?: string | null;
    logoUrl: string | null;
    address: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    publicDescription: string | null;
    status: string;
    subscriptionStatus: string;
    nextBillingAt: string | null;
    balanceUsdt: number;
    contributionAmountUsdt: string;
    cycleDurationDays: number;
    maxSharesPerMeeting: number;
    meetingIntervalDays: number;
    maxMembers: number;
    me: { role: string; status: string };
  };
  members: AvecMemberRow[];
  memberCount: number;
};

type Tab = "overview" | "members" | "chat" | "reports" | "treasury";

export default function AvecDashboardPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const id = params.id;
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shares, setShares] = useState(1);
  const [tab, setTab] = useState<Tab>("overview");

  const me = data?.group.me;
  const canModerate =
    me?.status === "approved" && (me.role === "admin" || me.role === "co_admin");
  const canAdmin = me?.status === "approved" && me.role === "admin";
  const canContribute = me?.status === "approved";
  const shareValue = data ? Number(data.group.contributionAmountUsdt) : 0;
  const meetingTotal = shareValue * shares;
  const maxShares = data?.group.maxSharesPerMeeting ?? 5;

  async function load() {
    setErr(null);
    const res = await fetch(`/api/groups/${id}`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "…");
      setData(null);
      return;
    }
    setData(j as Dashboard);
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function payShares() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shares }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "…");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reviewMember(userId: string, accept: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "…");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "overview", label: t("avec_tab_overview"), icon: <AvecIconShares className="h-4 w-4" /> },
    { id: "members", label: t("avec_tab_members"), icon: <AvecIconMembers className="h-4 w-4" /> },
    { id: "chat", label: t("avec_tab_chat"), icon: null },
    { id: "reports", label: t("avec_tab_reports"), icon: null },
    { id: "treasury", label: t("avec_tab_treasury"), icon: <AvecIconTreasury className="h-4 w-4" /> },
  ];

  if (!data) {
    return (
      <div className="px-1 pb-10">
        <Link href="/app/wallet/groups" className="text-xs font-semibold text-[color:var(--fd-primary)]">
          ← {t("group_back")}
        </Link>
        {err ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {clientErrorText(t, err)}
          </p>
        ) : (
          <p className="mt-4 text-[color:var(--fd-muted)]">…</p>
        )}
      </div>
    );
  }

  const g = data.group;
  const days = g.nextBillingAt ? daysUntil(g.nextBillingAt) : null;
  const showDueSoon =
    g.subscriptionStatus === "active" && days != null && isReminderDay(days);
  const showOverdue = g.subscriptionStatus === "overdue" && g.status !== "suspended";
  const showSuspended = g.status === "suspended";

  return (
    <div className="pb-10">
      <AvecTopBar groupName={g.name} groupLogoUrl={g.logoUrl} />

      <div className="space-y-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
              AVEC
              {g.countryCode ? ` · ${countryLabel(locale, g.countryCode)}` : ""}
            </p>
            {g.publicDescription ? (
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{g.publicDescription}</p>
            ) : null}
            {(g.address || g.contactPhone || g.contactEmail) && (
              <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                {[g.address, g.contactPhone, g.contactEmail].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <GroupStatusBadge status={g.status} />
            {canAdmin ? (
              <Link href={`/app/wallet/groups/${g.id}/settings`} className={avecCls.btnGhost}>
                {t("group_dash_settings")}
              </Link>
            ) : null}
          </div>
        </div>

        <AvecRoleStrip role={me?.role ?? "member"} status={me?.status ?? "pending"} />

        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {clientErrorText(t, err)}
          </p>
        ) : null}

        {(showSuspended || showOverdue || showDueSoon) && (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {showSuspended
              ? t("group_reminder_suspended")
              : showOverdue
                ? t("group_reminder_overdue")
                : t("group_reminder_due_soon")}
          </p>
        )}

        <div className={avecCls.kpiGrid}>
          <AvecKpi label={t("group_dash_balance")} value={g.balanceUsdt.toFixed(0)} sub="USDT" />
          <AvecKpi label={t("avec_members_title")} value={data.memberCount} sub={`/${g.maxMembers}`} />
          <AvecKpi label={t("group_dash_cycle")} value={g.cycleDurationDays} sub={`${g.meetingIntervalDays}d`} />
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-1">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={`flex shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                tab === x.id
                  ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                  : "text-[color:var(--fd-muted)]"
              }`}
            >
              {x.icon}
              {x.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className={avecCls.section}>
            <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("avec_buy_shares")}</p>
            <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
              {shareValue.toFixed(2)} USDT · {t("avec_wallet_debit")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from({ length: maxShares }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setShares(n)}
                  className={`${avecCls.shareChip} ${shares === n ? avecCls.shareChipOn : avecCls.shareChipOff}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <div>
                <p className={avecCls.sectionTitle}>{t("avec_meeting_total")}</p>
                <p className="text-xl font-black tabular-nums text-[color:var(--fd-primary)]">
                  {meetingTotal.toFixed(2)} USDT
                </p>
              </div>
              <button
                type="button"
                disabled={busy || !canContribute}
                onClick={() => void payShares()}
                className={`${avecCls.btnPrimary} !w-auto px-6`}
              >
                {t("group_dash_contribute")}
              </button>
            </div>
          </div>
        )}

        {tab === "members" && (
          <div className={avecCls.section}>
            <AvecMemberList
              members={data.members}
              canModerate={!!canModerate}
              busy={busy}
              onReview={(uid, ok) => void reviewMember(uid, ok)}
            />
          </div>
        )}

        {tab === "chat" && (
          <AvecChatroom groupId={id} canPost={canContribute} />
        )}

        {tab === "reports" && <AvecReportsPanel groupId={id} />}

        {tab === "treasury" && (
          <div className="space-y-3">
            {canModerate ? (
              <AvecPayoutPanel
                groupId={id}
                members={data.members}
                onDone={() => void load()}
              />
            ) : null}
            <AvecReportsPanel groupId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
