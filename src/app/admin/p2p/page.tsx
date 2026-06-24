"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type DisputeRow = {
  id: string;
  fiatAmount: string;
  fiatCurrency: string;
  cryptoAmount: string;
  asset: string;
  disputedAt: string;
  disputeReason: string | null;
  makerMasked: string;
  takerMasked: string;
};

type ReportRow = {
  id: string;
  reason: string;
  details: string | null;
  orderId: string | null;
  createdAt: string;
  reporterMasked: string;
};

export default function AdminP2pDisputesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<DisputeRow[] | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reportBusyId, setReportBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const [disRes, repRes] = await Promise.all([
      fetch("/api/admin/p2p/disputes"),
      fetch("/api/admin/p2p/reports"),
    ]);
    const disData = await disRes.json().catch(() => ({}));
    const repData = await repRes.json().catch(() => ({}));
    if (!disRes.ok) {
      setRows([]);
      setErr(typeof disData.message === "string" ? disData.message : "Forbidden");
      return;
    }
    setRows(disData.disputes as DisputeRow[]);
    setReports(repRes.ok ? (repData.reports as ReportRow[]) : []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(id: string, resolution: "release_buyer" | "refund_seller") {
    setBusyId(id);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/p2p/orders/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function resolveReport(id: string, status: "resolved" | "dismissed") {
    setReportBusyId(id);
    setErr(null);
    try {
      const res = await fetch("/api/admin/p2p/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_report_failed");
        return;
      }
      await load();
    } finally {
      setReportBusyId(null);
    }
  }

  return (
    <div className={adminCls.page}>
      <AdminBackLink>{t("admin_back")}</AdminBackLink>
      <AdminPageHeader title={t("admin_p2p_disputes")} subtitle={t("admin_p2p_intro")} />

      <Link href="/admin/p2p/inbox" className={adminCls.btnSecondary}>
        {t("admin_p2p_support_inbox")}
      </Link>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      <h2 className="mt-8 text-sm font-bold text-[color:var(--fd-text)]">{t("admin_p2p_reports")}</h2>
      {!reports?.length ? (
        <p className={`mt-2 ${adminCls.empty}`}>{t("admin_p2p_reports_none")}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {reports.map((r) => (
            <li key={r.id} className={adminCls.card}>
              <p className="text-xs font-bold uppercase text-rose-700">{r.reason}</p>
              <p className={`mt-1 text-xs ${adminCls.muted}`}>{r.reporterMasked}</p>
              {r.details ? (
                <p className={`mt-2 whitespace-pre-wrap text-xs ${adminCls.muted}`}>{r.details}</p>
              ) : null}
              {r.orderId ? (
                <Link href={`/admin/p2p/orders/${r.orderId}`} className="mt-2 block text-xs font-semibold text-[color:var(--fd-primary)]">
                  {t("admin_p2p_open_order")}
                </Link>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={reportBusyId === r.id}
                  onClick={() => void resolveReport(r.id, "resolved")}
                  className={`${adminCls.btnPrimary} disabled:opacity-40`}
                >
                  {t("admin_p2p_report_resolve")}
                </button>
                <button
                  type="button"
                  disabled={reportBusyId === r.id}
                  onClick={() => void resolveReport(r.id, "dismissed")}
                  className={`${adminCls.btnSecondary} disabled:opacity-40`}
                >
                  {t("admin_p2p_report_dismiss")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-bold text-[color:var(--fd-text)]">{t("admin_p2p_disputes")}</h2>

      {!rows?.length ? (
        <p className={`mt-2 ${adminCls.empty}`}>{t("admin_p2p_none")}</p>
      ) : (
        <ul className="mt-3 space-y-4">
          {rows.map((r) => (
            <li key={r.id} className={adminCls.card}>
              <p className={`font-mono text-xs ${adminCls.muted}`}>{r.id}</p>
              <p className="mt-2 font-semibold text-[color:var(--fd-text)]">
                {r.fiatAmount} {r.fiatCurrency} → {r.cryptoAmount} {r.asset}
              </p>
              <p className={`mt-1 text-xs ${adminCls.muted}`}>
                {r.makerMasked} ↔ {r.takerMasked}
              </p>
              {r.disputeReason ? (
                <p className={`mt-2 whitespace-pre-wrap ${adminCls.muted}`}>{r.disputeReason}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "release_buyer")}
                  className={`${adminCls.btnPrimary} disabled:opacity-40`}
                >
                  {t("admin_p2p_release_buyer")}
                </button>
                <button
                  type="button"
                  disabled={busyId === r.id}
                  onClick={() => void resolve(r.id, "refund_seller")}
                  className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-800 disabled:opacity-40"
                >
                  {t("admin_p2p_refund_seller")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
