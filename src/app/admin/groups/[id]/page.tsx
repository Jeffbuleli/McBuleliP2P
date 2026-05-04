"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";

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
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{t("admin_group")}</h2>
          <Link href="/admin/groups" className="text-sm text-amber-200 underline">
            {t("admin_back")}
          </Link>
        </div>
        {err ? <p className="text-rose-400">{err}</p> : <p className="text-stone-500">…</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
            {row.type}
          </p>
          <h2 className="text-xl font-bold text-white">{row.name}</h2>
          <p className="mt-1 text-sm text-stone-300">{row.createdByEmail}</p>
        </div>
        <Link href="/admin/groups" className="text-sm text-amber-200 underline">
          {t("admin_back")}
        </Link>
      </div>

      {err ? <p className="mb-3 text-rose-400">{err}</p> : null}

      <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4">
        <p className="text-sm text-stone-200">
          {t("admin_status")}: <span className="font-mono">{row.status}</span> ·{" "}
          {t("admin_subscription")}:{" "}
          <span className="font-mono">{row.subscriptionStatus}</span>
        </p>
        <p className="mt-1 text-sm text-stone-400">
          {row.contributionAmountUsdt} USDT · {row.cycleDurationDays}d ·{" "}
          {row.countryCode ? countryLabel(locale, row.countryCode) : "—"}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Next billing:{" "}
          {row.nextBillingAt ? new Date(row.nextBillingAt).toLocaleString() : "—"}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={runBilling}
          className="rounded-xl border border-stone-600 bg-stone-950 px-4 py-2 text-sm font-semibold text-stone-100 disabled:opacity-50"
        >
          {t("admin_run_billing")}
        </button>
        {canReview ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => void review("approve")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {t("admin_approve")}
            </button>
            <div className="flex flex-1 gap-2">
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("admin_reject_reason")}
                className="w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100"
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
        <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4">
          <h3 className="text-sm font-bold text-white">{t("group_settings_payment_history")}</h3>
          {invoices === null ? (
            <p className="mt-2 text-stone-500">…</p>
          ) : invoices.length === 0 ? (
            <p className="mt-2 text-stone-500">—</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {invoices.map((x: any) => (
                <li key={x.id} className="rounded-xl border border-stone-700 bg-stone-950/50 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-stone-200">{x.period}</span>
                    <span className="text-xs text-stone-400">{x.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">
                    {Number(x.amountUsdt).toFixed(2)} USDT ·{" "}
                    {x.paidAt ? new Date(x.paidAt).toLocaleString() : "—"}
                  </p>
                  {x.failureReason ? (
                    <p className="mt-1 text-[11px] text-rose-300">{x.failureReason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-4">
          <h3 className="text-sm font-bold text-white">{t("group_settings_audit_log")}</h3>
          {audit === null ? (
            <p className="mt-2 text-stone-500">…</p>
          ) : audit.length === 0 ? (
            <p className="mt-2 text-stone-500">—</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {audit.map((x: any) => (
                <li key={x.id} className="rounded-xl border border-stone-700 bg-stone-950/50 px-3 py-2">
                  <p className="text-xs font-semibold text-stone-200">{x.action}</p>
                  <p className="mt-1 text-[11px] text-stone-500">
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

