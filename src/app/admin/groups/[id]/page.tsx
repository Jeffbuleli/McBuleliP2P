"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import { apiErrorText } from "@/lib/api-error-text";
import { GroupAuditEntry } from "@/components/groups/group-audit-entry";
import { GroupStatusBadge } from "@/components/groups/group-status-badge";
import { adminCls, AdminBackLink } from "@/components/admin/admin-ui";
import type { Messages } from "@/i18n/messages";

type Group = {
  id: string;
  type: string;
  name: string;
  status: string;
  subscriptionStatus: string;
  nextBillingAt: string | null;
  contributionAmountUsdt: string;
  cycleDurationDays: number;
  countryCode: string | null;
  createdAt: string;
  createdByEmail: string;
};

function formatUsdt(v: string): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : v;
}

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

export default function AdminGroupDetailPage() {
  const { t, locale } = useI18n();
  const routeParams = useParams();
  const id = typeof routeParams.id === "string" ? routeParams.id.trim() : "";
  const [row, setRow] = useState<Group | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [invoices, setInvoices] = useState<any[] | null>(null);
  const [audit, setAudit] = useState<any[] | null>(null);

  const canReview = useMemo(() => row?.status === "pending", [row?.status]);

  async function load() {
    if (!id) return;
    setErr(null);
    const res = await fetch(`/api/admin/groups/${id}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      group?: Group;
    };
    if (!res.ok) {
      setErr(
        apiErrorText(
          t,
          data,
          res.status === 404 ? "admin_not_found" : "admin_load_failed",
        ),
      );
      setRow(null);
      return;
    }
    const group = data.group ?? null;
    if (!group?.id) {
      setErr(t("admin_not_found"));
      setRow(null);
      return;
    }
    setRow(group);
    const [rInv, rAud] = await Promise.all([
      fetch(`/api/admin/groups/${id}/subscription?limit=24`, { cache: "no-store" }),
      fetch(`/api/admin/groups/${id}/audit?limit=80`, { cache: "no-store" }),
    ]);
    const inv = await rInv.json().catch(() => ({}));
    setInvoices((inv as any).invoices ?? []);
    const aud = await rAud.json().catch(() => ({}));
    setAudit((aud as any).audit ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function review(decision: "approve" | "reject") {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/groups/${id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === "reject" ? rejectReason : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(apiErrorText(t, data as { error?: string; message?: string }, "admin_load_failed"));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function runBilling() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/groups/billing/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(apiErrorText(t, data as { error?: string; message?: string }, "admin_load_failed"));
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!id || !row) {
    return (
      <div className={adminCls.page}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={adminCls.h1}>{t("admin_group")}</h2>
          <AdminBackLink href="/admin/groups">{t("admin_back")}</AdminBackLink>
        </div>
        {err ? <p className={adminCls.error}>{err}</p> : (
          <p className={adminCls.muted}>…</p>
        )}
      </div>
    );
  }

  return (
    <div className={adminCls.page}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[color:var(--fd-primary)]">
            {row.type}
          </p>
          <h2 className={adminCls.h1}>{row.name}</h2>
          <p className={`mt-1 text-sm ${adminCls.muted}`}>{row.createdByEmail}</p>
        </div>
        <AdminBackLink href="/admin/groups">{t("admin_back")}</AdminBackLink>
      </div>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {canReview ? (
        <div className="mb-4 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t("admin_groups_review_pending")}
        </div>
      ) : null}

      <div className={adminCls.card}>
        <div className="flex flex-wrap items-center gap-2">
          <GroupStatusBadge status={row.status} />
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold text-stone-700 ring-1 ring-stone-200">
            {subscriptionLabel(t, row.subscriptionStatus)}
          </span>
        </div>
        <p className={`mt-2 text-sm ${adminCls.muted}`}>
          {formatUsdt(row.contributionAmountUsdt)} USDT · {row.cycleDurationDays}d ·{" "}
          {row.countryCode ? countryLabel(locale, row.countryCode) : "-"}
        </p>
        <p className={`mt-1 text-xs ${adminCls.muted}`}>
          Next billing:{" "}
          {row.nextBillingAt ? new Date(row.nextBillingAt).toLocaleString() : "-"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {canReview ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <button
              type="button"
              disabled={busy}
              onClick={() => void review("approve")}
              className={adminCls.btnPrimary}
            >
              {t("admin_approve")}
            </button>
            <div className="flex flex-1 gap-2">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("admin_reject_reason")}
                className={`w-full ${adminCls.input}`}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void review("reject")}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {t("admin_reject")}
              </button>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={runBilling}
          className={`${adminCls.btnSecondary} self-start`}
        >
          {t("admin_run_billing")}
        </button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={adminCls.card}>
          <h3 className={adminCls.h2}>{t("group_settings_payment_history")}</h3>
          {invoices === null ? (
            <p className={`mt-2 ${adminCls.muted}`}>…</p>
          ) : invoices.length === 0 ? (
            <p className={`mt-2 ${adminCls.muted}`}>-</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {invoices.map((x: any) => (
                <li key={x.id} className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[color:var(--fd-text)]">{x.period}</span>
                    <span className={`text-xs ${adminCls.muted}`}>{x.status}</span>
                  </div>
                  <p className={`mt-1 text-xs ${adminCls.muted}`}>
                    {Number(x.amountUsdt).toFixed(2)} USDT ·{" "}
                    {x.paidAt ? new Date(x.paidAt).toLocaleString() : "-"}
                  </p>
                  {x.failureReason ? (
                    <p className="mt-1 text-[11px] text-rose-700">{x.failureReason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={adminCls.card}>
          <h3 className={adminCls.h2}>{t("group_settings_audit_log")}</h3>
          {audit === null ? (
            <p className={`mt-2 ${adminCls.muted}`}>…</p>
          ) : audit.length === 0 ? (
            <p className={`mt-2 ${adminCls.muted}`}>-</p>
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
      </div>
    </div>
  );
}
