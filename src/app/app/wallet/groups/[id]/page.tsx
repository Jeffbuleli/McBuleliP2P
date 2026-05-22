"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { TransactionStepper } from "@/components/wallet/transaction-progress";
import { groupCreationProgressSteps } from "@/lib/group-create-progress";
import { AvecChatroom } from "@/components/groups/avec-chatroom";
import {
  AvecIconDialogue,
  AvecIconMembers,
  AvecIconReport,
  AvecIconTreasury,
  AvecIconShares,
  AvecIconView,
} from "@/components/groups/avec-icons";
import { AvecMembersPanel } from "@/components/groups/avec-members-panel";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { p2pDisplayName } from "@/lib/p2p-display";
import { AvecMeetingPanel } from "@/components/groups/avec-meeting-panel";
import { AvecOverviewPanel } from "@/components/groups/avec-overview-panel";
import { AvecPayoutPanel } from "@/components/groups/avec-payout-panel";
import { AvecLoansPanel } from "@/components/groups/avec-loans-panel";
import { AvecTreasuryFunds } from "@/components/groups/avec-treasury-funds";
import { AvecReportsPanel } from "@/components/groups/avec-reports-panel";
import { AvecRoleStrip } from "@/components/groups/avec-role-strip";
import { AvecTopBar } from "@/components/groups/avec-top-bar";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { daysUntil, isReminderDay } from "@/lib/group-savings-reminders";
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
    socialFundUsdt: string;
    maxMembers: number;
    createdAt: string;
    me: { role: string; status: string };
  };
  viewer: {
    email: string;
    displayName: string | null;
    piUsername: string | null;
  };
  members: AvecMemberRow[];
  memberCount: number;
};

type Tab = "vue" | "meeting" | "members" | "treasury" | "dialogue" | "reports";

export default function AvecDashboardPage() {
  const { t } = useI18n();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const showCreateProgress = searchParams.get("created") === "1";
  const id = typeof routeParams.id === "string" ? routeParams.id : "";
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payOk, setPayOk] = useState(false);
  const [fundsRefresh, setFundsRefresh] = useState(0);
  const [tab, setTab] = useState<Tab>("vue");
  const [myUserId, setMyUserId] = useState<string | undefined>();

  const me = data?.group.me;
  const canModerate =
    me?.status === "approved" && (me.role === "admin" || me.role === "co_admin");
  const canAdmin = me?.status === "approved" && me.role === "admin";
  const groupActive = data?.group.status === "active";
  const canContribute = me?.status === "approved" && groupActive;
  const shareValue = data ? Number(data.group.contributionAmountUsdt) : 0;
  const socialFundPerMeeting = data ? Number(data.group.socialFundUsdt) : 0;
  const maxShares = data?.group.maxSharesPerMeeting ?? 5;

  const pendingCount = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "pending").length,
    [data?.members],
  );

  async function load() {
    if (!id) {
      setErr(t("group_not_found"));
      setData(null);
      return;
    }
    setErr(null);
    const res = await fetch(`/api/groups/${id}`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "group_dashboard_failed");
      setData(null);
      return;
    }
    setData(j as Dashboard);
  }

  useEffect(() => {
    void load();
  }, [id]);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (j?.user?.id) setMyUserId(j.user.id);
      })
      .catch(() => {});
  }, []);

  const mentionMembers = useMemo(
    () =>
      (data?.members ?? [])
        .filter((m) => m.status === "approved")
        .map((m) => ({
          userId: m.userId,
          email: m.email,
          avatarUrl: m.avatarUrl ?? null,
          label: p2pDisplayName({
            email: m.email,
            displayName: m.displayName ?? null,
            avatarUrl: m.avatarUrl ?? null,
            piUsername: null,
          }),
        })),
    [data?.members],
  );

  async function payShares(shares: number): Promise<boolean> {
    setBusy(true);
    setErr(null);
    setPayOk(false);
    try {
      const res = await fetch(`/api/groups/${id}/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shares }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_contribution_failed");
        return false;
      }
      setPayOk(true);
      setFundsRefresh((n) => n + 1);
      await load();
      return true;
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "vue", label: t("avec_tab_vue"), icon: <AvecIconView className="h-4 w-4" /> },
    { id: "meeting", label: t("avec_tab_meeting"), icon: <AvecIconShares className="h-4 w-4" /> },
    { id: "members", label: t("avec_tab_members"), icon: <AvecIconMembers className="h-4 w-4" /> },
    { id: "treasury", label: t("avec_tab_treasury"), icon: <AvecIconTreasury className="h-4 w-4" /> },
    { id: "dialogue", label: t("avec_tab_dialogue"), icon: <AvecIconDialogue className="h-4 w-4" /> },
    { id: "reports", label: t("avec_tab_reports"), icon: <AvecIconReport className="h-4 w-4" /> },
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
      <AvecTopBar
        groupName={g.name}
        groupLogoUrl={g.logoUrl}
        countryCode={g.countryCode}
        memberEmail={data.viewer.email}
        memberDisplayName={data.viewer.displayName}
        memberPiUsername={data.viewer.piUsername}
      />

      <div className="space-y-3 px-1">
        {g.status === "pending" || showCreateProgress ? (
          <TransactionStepper steps={groupCreationProgressSteps(g.status)} />
        ) : null}
        {g.status === "pending" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {t("group_create_pending_note")}
          </p>
        ) : null}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {g.publicDescription ? (
              <p className="text-xs text-[color:var(--fd-muted)]">{g.publicDescription}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <GroupStatusBadge status={g.status} />
            {canAdmin ? (
              <Link href={`/app/wallet/groups/${g.id}/settings`} className="text-[10px] font-bold text-[color:var(--fd-primary)] underline">
                {t("group_dash_settings")}
              </Link>
            ) : null}
          </div>
        </div>

        <AvecRoleStrip role={me?.role ?? "member"} status={me?.status ?? "pending"} />

        {payOk && !err ? (
          <p
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900"
            role="status"
          >
            <span aria-hidden>✓</span>
            {t("group_contribution_success")}
          </p>
        ) : null}
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

        <div className="flex gap-1 overflow-x-auto rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-1 scrollbar-none">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                if (x.id !== "meeting") setPayOk(false);
                setTab(x.id);
              }}
              className={`flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition ${
                tab === x.id
                  ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                  : "text-[color:var(--fd-muted)]"
              }`}
            >
              {x.icon}
              <span className="max-w-[4.5rem] truncate">{x.label}</span>
            </button>
          ))}
        </div>

        {tab === "vue" &&
          (groupActive ? (
            <AvecOverviewPanel
              groupId={id}
              group={g}
              memberCount={data.memberCount}
              members={data.members}
              pendingCount={pendingCount}
              onNavigate={(t) => setTab(t)}
            />
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {t("group_create_pending_note")}
            </p>
          ))}

        {tab === "meeting" &&
          (groupActive ? (
            <AvecMeetingPanel
              shareValue={shareValue}
              socialFundPerMeeting={socialFundPerMeeting}
              maxShares={maxShares}
              canContribute={!!canContribute}
              busy={busy}
              paySuccess={payOk}
              onPay={payShares}
            />
          ) : (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {t("group_create_pending_note")}
            </p>
          ))}

        {tab === "members" && (
          <AvecMembersPanel
            groupId={id}
            members={data.members}
            canModerate={!!canModerate}
            canAdmin={!!canAdmin}
            busy={busy}
            onRefresh={() => void load()}
          />
        )}

        {tab === "dialogue" && (
          <AvecChatroom
            groupId={id}
            myUserId={myUserId}
            canPost={me?.status === "approved" && (groupActive || canAdmin)}
            mentionMembers={mentionMembers}
          />
        )}

        {tab === "reports" && <AvecReportsPanel groupId={id} />}

        {tab === "treasury" && (
          <div className="space-y-3">
            <AvecTreasuryFunds groupId={id} onRefreshKey={fundsRefresh} />
            <AvecLoansPanel
              groupId={id}
              members={data.members}
              myUserId={myUserId}
              onDone={() => {
                setFundsRefresh((n) => n + 1);
                void load();
              }}
            />
            {canModerate ? (
              <AvecPayoutPanel
                groupId={id}
                members={data.members}
                myUserId={myUserId}
                onDone={() => {
                  setFundsRefresh((n) => n + 1);
                  void load();
                }}
              />
            ) : null}
          </div>
        )}
      </div>
      <McBuleliPoweredFooter />
    </div>
  );
}
