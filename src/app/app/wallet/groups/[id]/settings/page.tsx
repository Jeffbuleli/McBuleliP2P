"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { AvecProfileForm } from "@/components/groups/avec-profile-form";
import { AvecSettingsSections } from "@/components/groups/avec-settings-sections";
import { AvecTopBar } from "@/components/groups/avec-top-bar";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { daysUntil, isReminderDay } from "@/lib/group-savings-reminders";
import { clientErrorText } from "@/lib/client-error-text";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";

type MemberRow = {
  userId: string;
  role: string;
  status: string;
  email: string;
  displayName?: string | null;
};

type Dashboard = {
  ok: true;
  group: {
    id: string;
    type: string;
    name: string;
    logoUrl?: string | null;
    address?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    publicDescription?: string | null;
    countryCode?: string | null;
    status: string;
    subscriptionStatus: string;
    nextBillingAt: string | null;
    me: { role: string; status: string };
  };
  viewer: {
    email: string;
    displayName: string | null;
    piUsername: string | null;
    kycApproved?: boolean;
  };
  members: MemberRow[];
};

export default function GroupSettingsPage() {
  const { t, locale } = useI18n();
  const routeParams = useParams();
  const id = typeof routeParams.id === "string" ? routeParams.id : "";
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [committeeSelected, setCommitteeSelected] = useState<Record<string, boolean>>({});
  const [invoices, setInvoices] = useState<any[] | null>(null);
  const [audit, setAudit] = useState<any[] | null>(null);

  const me = data?.group.me;
  const canAdmin = me?.status === "approved" && me.role === "admin";

  const approvedMembers = useMemo(
    () => (data?.members ?? []).filter((m) => m.status === "approved"),
    [data?.members],
  );

  async function load() {
    if (!id) return;
    setErr(null);
    const [rDash, rInv, rAudit] = await Promise.all([
      fetch(`/api/groups/${id}`, { cache: "no-store" }),
      fetch(`/api/groups/${id}/subscription?limit=48`, { cache: "no-store" }),
      fetch(`/api/groups/${id}/audit?limit=100`, { cache: "no-store" }),
    ]);
    const j = await rDash.json().catch(() => ({}));
    if (!rDash.ok) {
      setErr((j as { error?: string }).error ?? "group_dashboard_failed");
      setData(null);
      setInvoices([]);
      setAudit([]);
      return;
    }
    const d = j as Dashboard;
    setData(d);
    const inv = await rInv.json().catch(() => ({}));
    setInvoices((inv as { invoices?: unknown[] }).invoices ?? []);
    const aud = await rAudit.json().catch(() => ({}));
    setAudit((aud as { audit?: unknown[] }).audit ?? []);

    const init: Record<string, boolean> = {};
    const initCommittee: Record<string, boolean> = {};
    for (const m of d.members) {
      if (m.role === "co_admin") init[m.userId] = true;
      if (m.role === "committee") initCommittee[m.userId] = true;
    }
    setSelected(init);
    setCommitteeSelected(initCommittee);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .slice(0, 3);
  }, [selected]);

  const committeeIds = useMemo(() => {
    return Object.entries(committeeSelected)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .slice(0, 7);
  }, [committeeSelected]);

  async function saveCoAdmins() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "set_co_admins",
          justification: t("group_gov_coadmins_justification"),
          payload: { coAdminUserIds: selectedIds },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveCommittee() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "set_committee",
          justification: t("group_gov_committee_justification"),
          payload: { committeeUserIds: committeeIds },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!id || !data) {
    return (
      <div className="space-y-3 px-1 pb-10">
        <h1 className="text-lg font-bold text-[color:var(--fd-text)]">
          {t("group_settings_title")}
        </h1>
        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {clientErrorText(t, err)}
          </p>
        ) : (
          <p className="text-[color:var(--fd-muted)]">…</p>
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

  const reminderBlock =
    showSuspended ? (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
        <p className="font-bold">{t("group_reminder_suspended")}</p>
        <p className="mt-1 opacity-90">{t("group_reminder_suspended_body")}</p>
      </div>
    ) : showOverdue ? (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <p className="font-bold">{t("group_reminder_overdue")}</p>
        <p className="mt-1 opacity-90">{t("group_reminder_overdue_body")}</p>
      </div>
    ) : showDueSoon ? (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        <p className="font-bold">{t("group_reminder_due_soon")}</p>
        <p className="mt-1 opacity-90">{t("group_reminder_due_soon_body")}</p>
      </div>
    ) : null;

  return (
    <div className="space-y-3 px-1 pb-10">
      <AvecTopBar
        groupName={g.name}
        groupLogoUrl={g.logoUrl ?? null}
        countryCode={g.countryCode}
        memberEmail={data.viewer.email}
        memberDisplayName={data.viewer.displayName}
        memberPiUsername={data.viewer.piUsername}
        memberKycApproved={data.viewer.kycApproved}
        backHref={`/app/wallet/groups/${id}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <GroupStatusBadge status={g.status} />
        <h1 className="text-base font-bold text-[color:var(--fd-text)]">
          {t("group_settings_title")}
        </h1>
      </div>

      {canAdmin ? (
        <AvecProfileForm
          groupId={id}
          initial={{
            name: g.name,
            logoUrl: g.logoUrl ?? null,
            address: g.address ?? null,
            contactPhone: g.contactPhone ?? null,
            contactEmail: g.contactEmail ?? null,
            publicDescription: g.publicDescription ?? null,
          }}
          onSaved={() => void load()}
        />
      ) : null}

      {err ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      <AvecSettingsSections
        locale={locale}
        subscriptionStatus={g.subscriptionStatus}
        nextBillingAt={g.nextBillingAt}
        invoices={invoices}
        audit={audit}
        approvedMembers={approvedMembers}
        canAdmin={!!canAdmin}
        busy={busy}
        selected={selected}
        onSelectedChange={setSelected}
        onSaveCoAdmins={() => void saveCoAdmins()}
        committeeSelected={committeeSelected}
        onCommitteeSelectedChange={setCommitteeSelected}
        onSaveCommittee={() => void saveCommittee()}
        reminderBlock={reminderBlock}
      />

      <McBuleliPoweredFooter />
    </div>
  );
}
