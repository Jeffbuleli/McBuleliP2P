"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminBackLink,
  AdminPageHeader,
  adminCls,
} from "@/components/admin/admin-ui";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";

type Row = {
  id: string;
  userEmail: string;
  tier: string;
  status: string;
  paidMcb: string;
  walletAddress: string | null;
  txHash: string | null;
  createdAt: string;
};

export default function AdminBuildersPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState("pending");
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const load = useCallback(async () => {
    setErr(null);
    const q = status === "all" ? "" : `?status=${status}`;
    const res = await fetch(`/api/admin/builders${q}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.message ?? "Error");
      setRows([]);
      return;
    }
    setRows(data.memberships as Row[]);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function complete(id: string) {
    if (!window.confirm(t("builders_admin_confirm"))) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/builders/${id}/complete`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message ?? "Error");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt(t("builders_admin_reject_prompt"));
    if (!reason?.trim()) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/builders/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(data.message ?? "Error");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  const columns = useMemo((): AdminTableColumn<Row>[] => {
    return [
      {
        id: "created",
        header: t("mcb_admin_col_date"),
        cell: (r) => new Date(r.createdAt).toLocaleString(loc),
      },
      {
        id: "user",
        header: t("mcb_admin_col_user"),
        cell: (r) => (
          <span className="font-medium text-[color:var(--fd-text)]">
            {r.userEmail}
          </span>
        ),
      },
      {
        id: "tier",
        header: t("builders_admin_col_tier"),
        cell: (r) => (
          <span className="capitalize font-semibold">
            {r.tier}
            <span className="block text-[10px] font-normal text-[color:var(--fd-muted)]">
              {r.paidMcb} McB
            </span>
          </span>
        ),
      },
      {
        id: "tx",
        header: "Tx",
        cell: (r) =>
          r.txHash ? (
            <span className="font-mono text-[10px] break-all">{r.txHash}</span>
          ) : (
            "-"
          ),
      },
      {
        id: "status",
        header: t("mcb_admin_col_status"),
        cell: (r) => <span className={adminCls.roleBadge}>{r.status}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: (r) =>
          r.status === "pending" ? (
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void complete(r.id)}
                className="rounded-lg bg-[color:var(--fd-primary)] px-2 py-1 text-[10px] font-bold text-white disabled:opacity-50"
              >
                {t("builders_admin_activate")}
              </button>
              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void reject(r.id)}
                className="rounded-lg border border-rose-300 px-2 py-1 text-[10px] font-bold text-rose-800 disabled:opacity-50"
              >
                {t("builders_admin_reject")}
              </button>
            </div>
          ) : null,
      },
    ];
  }, [busyId, loc, t]);

  return (
    <div>
      <AdminPageHeader
        title={t("builders_admin_title")}
        subtitle={t("builders_admin_subtitle")}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["pending", "active", "rejected", "expired", "cancelled", "all"] as const).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                status === s
                  ? "bg-[color:var(--fd-primary)] text-white"
                  : "border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-text)]"
              }`}
            >
              {s}
            </button>
          ),
        )}
      </div>

      {err ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {err}
        </p>
      ) : null}

      <AdminDataTable
        columns={columns}
        rows={rows ?? []}
        rowKey={(r) => r.id}
        emptyMessage={rows === null ? "…" : t("builders_admin_empty")}
      />
    </div>
  );
}
