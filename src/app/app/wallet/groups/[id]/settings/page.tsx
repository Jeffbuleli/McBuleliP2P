"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { AvecProfileForm } from "@/components/groups/avec-profile-form";
import { AvecTopBar } from "@/components/groups/avec-top-bar";
import { GroupAuditEntry } from "@/components/groups/group-audit-entry";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { daysUntil, isReminderDay } from "@/lib/group-savings-reminders";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { Messages } from "@/i18n/messages";

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
  };
  members: MemberRow[];
};

function subscriptionLabel(
  t: (k: keyof Messages) => string,
  status: string,
): string {
  const map: Record<string, keyof Messages> = {
    active: "admin_subscription_state_active",
    overdue: "admin_subscription_state_overdue",
    suspended: "admin_subscription_state_suspended",
  };
  const key = map[status?.toLowerCase?.() ?? ""];
  return key ? t(key) : status;
}

export default function GroupSettingsPage() {
  const { t, locale } = useI18n();
  const routeParams = useParams();
  const id = typeof routeParams.id === "string" ? routeParams.id : "";
  const [data, setData] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
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
      fetch(`/api/groups/${id}/subscription?limit=24`, { cache: "no-store" }),
      fetch(`/api/groups/${id}/audit?limit=60`, { cache: "no-store" }),
    ]);
    const j = await rDash.json().catch(() => ({}));
    if (!rDash.ok) {
      setErr((j as any).error ?? "…");
      setData(null);
      setInvoices([]);
      setAudit([]);
      return;
    }
    const d = j as Dashboard;
    setData(d);
    const inv = await rInv.json().catch(() => ({}));
    setInvoices((inv as any).invoices ?? []);
    const aud = await rAudit.json().catch(() => ({}));
    setAudit((aud as any).audit ?? []);

    const init: Record<string, boolean> = {};
    for (const m of d.members) {
      if (m.role === "co_admin") init[m.userId] = true;
    }
    setSelected(init);
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

  async function saveCoAdmins() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coAdminUserIds: selectedIds }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error ?? "…");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!id || !data) {
    return (
      <div className="space-y-3 pb-10">
        <h1 className="text-lg font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_title")}
        </h1>
        {err ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
            {clientErrorText(t, err)}
          </p>
        ) : (
          <p className="text-stone-500">…</p>
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
    <div className="space-y-4 pb-10">
      <AvecTopBar
        groupName={g.name}
        groupLogoUrl={g.logoUrl ?? null}
        countryCode={g.countryCode}
        memberEmail={data.viewer.email}
        memberDisplayName={data.viewer.displayName}
        memberPiUsername={data.viewer.piUsername}
        backHref={`/app/wallet/groups/${id}`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <GroupStatusBadge status={g.status} />
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-700 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-200">
          {subscriptionLabel(t, g.subscriptionStatus)}
        </span>
        <span className="text-xs text-stone-500">
          {t("group_dash_next_billing")}:{" "}
          {g.nextBillingAt ? new Date(g.nextBillingAt).toLocaleDateString() : "—"}
        </span>
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
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {showSuspended ? (
        <div className="rounded-2xl border border-rose-900/30 bg-rose-950/40 p-4">
          <p className="text-sm font-bold text-rose-200">{t("group_reminder_suspended")}</p>
          <p className="mt-1 text-xs leading-relaxed text-rose-200/80">
            {t("group_reminder_suspended_body")}
          </p>
        </div>
      ) : showOverdue ? (
        <div className="rounded-2xl border border-amber-900/30 bg-amber-950/30 p-4">
          <p className="text-sm font-bold text-amber-100">{t("group_reminder_overdue")}</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            {t("group_reminder_overdue_body")}
          </p>
        </div>
      ) : showDueSoon ? (
        <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/25 p-4">
          <p className="text-sm font-bold text-emerald-100">{t("group_reminder_due_soon")}</p>
          <p className="mt-1 text-xs leading-relaxed text-emerald-100/80">
            {t("group_reminder_due_soon_body")}
          </p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_subscription")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          {t("group_settings_subscription_note")}
        </p>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_payment_history")}
        </h2>
        {invoices === null ? (
          <p className="text-stone-500">…</p>
        ) : invoices.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">—</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {invoices.map((x: any) => (
              <li
                key={x.id}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-950"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    {t("group_invoice_period")}:{" "}
                    <span className="font-mono">{x.period}</span>
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      x.status === "paid"
                        ? "bg-emerald-600/15 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300"
                        : "bg-rose-600/15 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300"
                    }`}
                  >
                    {x.status === "paid" ? t("group_invoice_paid") : t("group_invoice_failed")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {t("group_invoice_amount")}:{" "}
                  <span className="font-mono">{Number(x.amountUsdt).toFixed(2)}</span> USDT
                </p>
                <p className="mt-1 text-[11px] text-stone-500">
                  {t("group_invoice_attempted")}:{" "}
                  {x.attemptedAt ? new Date(x.attemptedAt).toLocaleString() : "—"}
                  {" · "}
                  {t("group_invoice_paid_at")}:{" "}
                  {x.paidAt ? new Date(x.paidAt).toLocaleString() : "—"}
                </p>
                {x.failureReason ? (
                  <p className="mt-1 text-[11px] text-rose-500">{x.failureReason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_audit_log")}
        </h2>
        {audit === null ? (
          <p className="text-stone-500">…</p>
        ) : audit.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">—</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {audit.map((x: any) => (
              <GroupAuditEntry
                key={x.id}
                action={x.action}
                createdAt={x.createdAt}
                locale={locale}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900">
        <h2 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {t("group_settings_admin_panel")}
        </h2>
        {!canAdmin ? (
          <p className="mt-2 text-sm text-stone-500">{t("group_settings_admin_only")}</p>
        ) : (
          <>
            <p className="mt-2 text-xs text-stone-500">{t("group_settings_coadmins_note")}</p>
            <div className="mt-3 space-y-2">
              {approvedMembers.map((m) => {
                const label = p2pDisplayName({
                  email: m.email,
                  displayName: m.displayName ?? null,
                  avatarUrl: null,
                  piUsername: null,
                });
                return (
                  <label
                    key={m.userId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
                  >
                    <span className="min-w-0 truncate text-stone-800 dark:text-stone-200">
                      {label}
                      {m.role === "admin" ? (
                        <span className="ml-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          · {t("group_settings_role_admin")}
                        </span>
                      ) : m.role === "co_admin" ? (
                        <span className="ml-2 text-[11px] text-stone-500">
                          · {t("group_settings_role_coadmin")}
                        </span>
                      ) : null}
                    </span>
                    <input
                      type="checkbox"
                      disabled={busy || m.role === "admin"}
                      checked={Boolean(selected[m.userId])}
                      onChange={(e) =>
                        setSelected((s) => ({ ...s, [m.userId]: e.target.checked }))
                      }
                    />
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveCoAdmins()}
              className="mt-4 w-full rounded-xl bg-stone-900 py-3 text-sm font-bold text-white disabled:opacity-50 dark:bg-stone-50 dark:text-stone-950"
            >
              {t("group_settings_save")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
