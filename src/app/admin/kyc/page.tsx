"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import type { AdminKycHelpTier } from "@/lib/admin-kyc-help";
import type { Messages } from "@/i18n/messages";

const DIDIT_CONSOLE = "https://business.didit.me/fr/console";

type Row = {
  id: string;
  email: string;
  countryCode: string | null;
  kycStatus: string;
  kycUpdatedAt: string | null;
  kycRejectionNote: string | null;
  diditSessionId: string | null;
  diditSessionStatus: string | null;
  legalFirstName: string | null;
  legalLastName: string | null;
  helpTier: AdminKycHelpTier;
};

type Totals = {
  all: number;
  none: number;
  pending: number;
  manual_review: number;
  approved: number;
  rejected: number;
  needsHelp: number;
};

function statusKey(s: string): keyof Messages {
  const map: Record<string, keyof Messages> = {
    none: "admin_kyc_status_none",
    pending: "admin_kyc_status_pending",
    approved: "admin_kyc_status_approved",
    rejected: "admin_kyc_status_rejected",
    manual_review: "admin_kyc_status_manual_review",
  };
  return map[s] ?? "admin_kyc_status_none";
}

export default function AdminKycPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [helpOnly, setHelpOnly] = useState(false);
  const [q, setQ] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (helpOnly) params.set("help", "1");
    if (q.trim().length >= 2) params.set("q", q.trim());
    const res = await fetch(`/api/admin/kyc?${params}`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.message ?? "—");
      setRows([]);
      return;
    }
    setErr(null);
    setRows(data.rows as Row[]);
    setTotals(data.totals as Totals);
  }, [status, helpOnly, q]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q]);

  const helpLabel = useCallback(
    (tier: AdminKycHelpTier) => {
      if (tier === "review") return t("admin_kyc_help_review");
      if (tier === "legacy") return t("admin_kyc_help_legacy");
      if (tier === "stuck") return t("admin_kyc_help_stuck");
      if (tier === "retry") return t("admin_kyc_help_retry");
      return t("admin_kyc_help_none");
    },
    [t],
  );

  async function resetStale() {
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await fetch("/api/admin/kyc/reset-stale", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetMsg(data.message ?? "—");
        return;
      }
      setResetMsg(
        t("admin_kyc_reset_stale_done", {
          reset: data.reset ?? 0,
          scanned: data.scanned ?? 0,
        }),
      );
      await load();
    } finally {
      setResetting(false);
    }
  }

  const columns = useMemo((): AdminTableColumn<Row>[] => {
    return [
      {
        id: "email",
        header: t("admin_kyc_col_email"),
        sortable: true,
        sortValue: (r) => r.email,
        cell: (r) => (
          <div>
            <Link
              href={`/admin/users/${r.id}?tab=kyc`}
              className="font-semibold text-[color:var(--fd-primary)] hover:underline"
            >
              {r.email}
            </Link>
            {(r.legalFirstName || r.legalLastName) && (
              <p className="text-xs text-[color:var(--fd-muted)]">
                {[r.legalFirstName, r.legalLastName].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "country",
        header: t("admin_kyc_col_country"),
        sortable: true,
        sortValue: (r) => r.countryCode ?? "",
        cell: (r) => r.countryCode ?? "—",
      },
      {
        id: "status",
        header: t("admin_kyc_col_status"),
        sortable: true,
        sortValue: (r) => r.kycStatus,
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              r.kycStatus === "approved"
                ? "bg-emerald-100 text-emerald-800"
                : r.kycStatus === "pending" || r.kycStatus === "manual_review"
                  ? "bg-amber-100 text-amber-900"
                  : r.kycStatus === "rejected"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-stone-100 text-stone-600"
            }`}
          >
            {t(statusKey(r.kycStatus))}
          </span>
        ),
      },
      {
        id: "didit",
        header: t("admin_kyc_col_didit"),
        cell: (r) => (
          <div className="max-w-[10rem]">
            <p className="truncate text-xs font-medium">{r.diditSessionStatus ?? "—"}</p>
            {r.diditSessionId ? (
              <button
                type="button"
                className="mt-0.5 text-[10px] font-semibold text-[color:var(--fd-primary)] underline"
                onClick={(e) => {
                  e.stopPropagation();
                  void navigator.clipboard.writeText(r.diditSessionId!);
                  setCopied(r.id);
                  window.setTimeout(() => setCopied(null), 1500);
                }}
              >
                {copied === r.id ? t("admin_kyc_copied") : t("admin_kyc_copy_session")}
              </button>
            ) : null}
          </div>
        ),
      },
      {
        id: "updated",
        header: t("admin_kyc_col_updated"),
        sortable: true,
        sortValue: (r) => r.kycUpdatedAt ?? "",
        cell: (r) =>
          r.kycUpdatedAt
            ? new Date(r.kycUpdatedAt).toLocaleString(loc, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—",
      },
      {
        id: "help",
        header: t("admin_kyc_col_help"),
        sortable: true,
        sortValue: (r) => r.helpTier,
        cell: (r) => (
          <span
            className={`text-xs font-bold ${
              r.helpTier === "none" ? "text-[color:var(--fd-muted)]" : "text-amber-800"
            }`}
          >
            {helpLabel(r.helpTier)}
          </span>
        ),
      },
    ];
  }, [t, loc, helpLabel, copied]);

  if (rows === null) {
    return <p className={adminCls.muted}>…</p>;
  }

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin">{t("admin_nav_dashboard")}</AdminBackLink>
      <AdminPageHeader
        title={t("admin_kyc_title")}
        subtitle={t("admin_kyc_sub")}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={resetting}
              onClick={() => void resetStale()}
              className={adminCls.btnSecondary}
            >
              {resetting ? "…" : t("admin_kyc_reset_stale")}
            </button>
            <a
              href={DIDIT_CONSOLE}
              target="_blank"
              rel="noopener noreferrer"
              className={adminCls.btnPrimary}
            >
              {t("admin_kyc_didit_console")}
            </a>
          </div>
        }
      />

      {err ? <p className={adminCls.error}>{err}</p> : null}
      {resetMsg ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {resetMsg}
        </p>
      ) : null}

      <AdminSnapshotRow
        items={[
          { label: t("admin_kyc_filter_all"), value: totals?.all ?? rows.length },
          { label: t("admin_kyc_status_pending"), value: totals?.pending ?? 0, tone: "warn" },
          {
            label: t("admin_kyc_status_manual_review"),
            value: totals?.manual_review ?? 0,
            tone: "warn",
          },
          { label: t("admin_kyc_status_approved"), value: totals?.approved ?? 0 },
          { label: t("admin_kyc_filter_help"), value: totals?.needsHelp ?? 0, tone: "warn" },
        ]}
      />

      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage={t("admin_kyc_empty")}
        initialSortId="updated"
        initialSortDir="desc"
        totalLabel={t("admin_table_total", { count: rows.length })}
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={helpOnly ? "help" : status}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "help") {
                  setHelpOnly(true);
                  setStatus("all");
                } else {
                  setHelpOnly(false);
                  setStatus(v);
                }
              }}
              className={adminCls.select}
            >
              <option value="all">{t("admin_kyc_filter_all")}</option>
              <option value="none">{t("admin_kyc_status_none")}</option>
              <option value="pending">{t("admin_kyc_status_pending")}</option>
              <option value="manual_review">{t("admin_kyc_status_manual_review")}</option>
              <option value="approved">{t("admin_kyc_status_approved")}</option>
              <option value="rejected">{t("admin_kyc_status_rejected")}</option>
              <option value="help">{t("admin_kyc_filter_help")}</option>
            </select>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("admin_kyc_search_placeholder")}
              className={`${adminCls.input} min-w-[12rem] flex-1`}
            />
          </div>
        }
        rowClassName={(r) =>
          r.helpTier === "legacy" || r.helpTier === "stuck"
            ? "bg-amber-50/60"
            : undefined
        }
      />
    </div>
  );
}
