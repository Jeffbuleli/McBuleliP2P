"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WithdrawalStatus } from "@/lib/status";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import { useI18n } from "@/components/i18n-provider";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type Row = {
  id: string;
  userEmail: string;
  asset: string;
  networkCanonical: string;
  amount: string;
  fee: string;
  status: string;
  createdAt: string;
  assigneeEmail: string | null;
};

export default function AdminWithdrawalsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [slaHoursWithdrawal, setSlaHoursWithdrawal] = useState(24);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("active");
  const [assignFilter, setAssignFilter] = useState<string>("all");
  const [slaBreachedOnly, setSlaBreachedOnly] = useState(false);

  useEffect(() => {
    setErr(null);
    void (async () => {
      const q = new URLSearchParams();
      if (slaBreachedOnly) {
        q.set("slaBreached", "1");
      } else {
        q.set("status", status);
      }
      if (assignFilter !== "all") q.set("assignFilter", assignFilter);
      const res = await fetch(`/api/admin/withdrawals?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "…");
        setRows([]);
        return;
      }
      setRows(data.withdrawals as Row[]);
      if (typeof data.slaHoursWithdrawal === "number") {
        setSlaHoursWithdrawal(data.slaHoursWithdrawal);
      }
    })();
  }, [status, assignFilter, slaBreachedOnly]);

  if (rows === null) {
    return <p className={adminCls.muted}>…</p>;
  }

  function statusLabel(s: string) {
    if (s === WithdrawalStatus.PENDING_AGENT) return t("status_pending");
    if (s === WithdrawalStatus.PROCESSING) return t("status_busy");
    if (s === WithdrawalStatus.COMPLETED) return t("status_done");
    return s;
  }

  function rowOverSla(r: Row): boolean {
    if (
      r.status !== WithdrawalStatus.PENDING_AGENT &&
      r.status !== WithdrawalStatus.PROCESSING
    ) {
      return false;
    }
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    return ageMs > slaHoursWithdrawal * 3600 * 1000;
  }

  function waitHours(r: Row): string {
    const h = (Date.now() - new Date(r.createdAt).getTime()) / 3600000;
    if (!Number.isFinite(h) || h < 0) return "0";
    return h < 100 ? h.toFixed(1) : String(Math.round(h));
  }

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_queue")}
        subtitle={`${t("admin_withdrawal_sla_hours_note")}: ${slaHoursWithdrawal}h`}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className={`flex cursor-pointer items-center gap-2 ${adminCls.muted}`}>
          <input
            type="checkbox"
            checked={slaBreachedOnly}
            onChange={(e) => setSlaBreachedOnly(e.target.checked)}
            className="rounded border-[color:var(--fd-border)]"
          />
          {t("admin_withdrawal_sla_filter")}
        </label>
        <select
          value={status}
          disabled={slaBreachedOnly}
          onChange={(e) => setStatus(e.target.value)}
          className={adminCls.select}
        >
          <option value="active">{t("admin_pending")} + {t("admin_processing")}</option>
          <option value={WithdrawalStatus.PENDING_AGENT}>{t("admin_pending")}</option>
          <option value={WithdrawalStatus.PROCESSING}>{t("admin_processing")}</option>
          <option value={WithdrawalStatus.COMPLETED}>{t("admin_done")}</option>
          <option value={WithdrawalStatus.REJECTED}>{t("admin_rejected")}</option>
        </select>
        <select
          value={assignFilter}
          onChange={(e) => setAssignFilter(e.target.value)}
          className={adminCls.select}
        >
          <option value="all">{t("admin_all")}</option>
          <option value="unassigned">{t("admin_unassigned")}</option>
          <option value="mine">{t("admin_mine")}</option>
        </select>
      </div>
      {err ? <p className={adminCls.error}>{err}</p> : null}
      {rows.length === 0 ? (
        <p className={adminCls.empty}>—</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/withdrawals/${r.id}`} className={adminCls.listLink}>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="min-w-0 font-mono text-sm text-[color:var(--fd-primary)]">
                    {rowOverSla(r) ? (
                      <span className="mr-1 inline-block rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                        {t("admin_withdrawal_over_sla_badge")} · {waitHours(r)}h
                      </span>
                    ) : null}
                    <span className="mr-1 inline-block rounded bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
                      {r.asset}
                    </span>
                    <span className="break-all text-[color:var(--fd-text)]">
                      {r.amount}+{r.fee} {r.asset} ·{" "}
                      {activityNetworkLabel(locale, r.networkCanonical)}
                    </span>
                  </span>
                  <span className={`text-xs ${adminCls.muted}`}>
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={`mt-1 text-sm ${adminCls.muted}`}>{r.userEmail}</p>
                <p className="mt-1 text-xs font-medium text-[color:var(--fd-primary)]">
                  {statusLabel(r.status)}
                  {r.assigneeEmail ? ` · ${r.assigneeEmail}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
