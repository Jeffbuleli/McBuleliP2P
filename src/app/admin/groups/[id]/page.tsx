"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import { adminCls, AdminBackLink } from "@/components/admin/admin-ui";

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

export default function AdminGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { t, locale } = useI18n();
  const id = params.id;
  const [row, setRow] = useState<Group | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [invoices, setInvoices] = useState<any[] | null>(null);
  const [audit, setAudit] = useState<any[] | null>(null);

  const canReview = useMemo(
    () => row?.status === "pending" || row?.status === "approved",
    [row?.status],
  );

  async function load() {
    setErr(null);
    const res = await fetch(`/api/admin/groups?status=all`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.message ?? "…");
      setRow(null);
      return;
    }
    const found = (data.groups as Group[]).find((g) => g.id === id) ?? null;
    setRow(found);
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
        setErr(data.message ?? "…");
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
        setErr(data.message ?? "…");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!row) {
    return (
      <div className={adminCls.page}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={adminCls.h1}>{t("admin_group")}</h2>
          <AdminBackLink href="/admin/groups">{t("admin_back")}</AdminBackLink>
        </div>
        {err ? <p className={adminCls.error}>{err}</p> : <p className={adminCls.muted}>…</p>}
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

      <div className={adminCls.card}>
        <p className="text-sm text-[color:var(--fd-text)]">
          {t("admin_status")}: <span className="font-mono">{row.status}</span> ·{" "}
          {t("admin_subscription")}:{" "}
          <span className="font-mono">{row.subscriptionStatus}</span>
        </p>
        <p className={`mt-1 text-sm ${adminCls.muted}`}>
          {row.contributionAmountUsdt} USDT · {row.cycleDurationDays}d ·{" "}
          {row.countryCode ? countryLabel(locale, row.countryCode) : "—"}
        </p>
        <p className={`mt-1 text-xs ${adminCls.muted}`}>
          Next billing:{" "}
          {row.nextBillingAt ? new Date(row.nextBillingAt).toLocaleString() : "—"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={runBilling}
          className={adminCls.btnSecondary}
        >
          {t("admin_run_billing")}
        </button>
        {canReview ? (
          <>
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
          </>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={adminCls.card}>
          <h3 className={adminCls.h2}>{t("group_settings_payment_history")}</h3>
          {invoices === null ? (
            <p className={`mt-2 ${adminCls.muted}`}>…</p>
          ) : invoices.length === 0 ? (
            <p className={`mt-2 ${adminCls.muted}`}>—</p>
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
                    {x.paidAt ? new Date(x.paidAt).toLocaleString() : "—"}
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
            <p className={`mt-2 ${adminCls.muted}`}>—</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {audit.map((x: any) => (
                <li key={x.id} className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2">
                  <p className="text-xs font-semibold text-[color:var(--fd-text)]">{x.action}</p>
                  <p className={`mt-1 text-[11px] ${adminCls.muted}`}>
                    {new Date(x.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
