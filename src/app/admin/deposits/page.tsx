"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DepositStatus } from "@/lib/status";
import { useI18n } from "@/components/i18n-provider";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls, AdminPageHeader } from "@/components/admin/admin-ui";

type Row = {
  id: string;
  userEmail: string;
  asset: string;
  networkCanonical: string;
  status: string;
  txid: string | null;
  amount: string | null;
  declaredAmountUsdt: string | null;
  createdAt: string;
};

export default function AdminDepositsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    setErr(null);
    void (async () => {
      const res = await fetch(`/api/admin/deposits?status=${encodeURIComponent(status)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "—");
        setRows([]);
        return;
      }
      setRows(data.deposits as Row[]);
    })();
  }, [status]);

  const columns: AdminTableColumn<Row>[] = [
    {
      id: "user",
      header: t("admin_team_col_email"),
      sortable: true,
      sortValue: (r) => r.userEmail,
      cell: (r) => (
        <Link
          href={`/admin/deposits/${r.id}`}
          className="font-medium text-[color:var(--fd-primary)] hover:underline"
        >
          {r.userEmail}
        </Link>
      ),
    },
    {
      id: "asset",
      header: t("admin_nav_deposits"),
      sortable: true,
      sortValue: (r) => `${r.asset}:${r.networkCanonical}`,
      cell: (r) => (
        <span className="text-xs text-[color:var(--fd-text)]">
          {r.asset} · {r.networkCanonical}
        </span>
      ),
    },
    {
      id: "status",
      header: t("admin_status"),
      sortable: true,
      sortValue: (r) => r.status,
      cell: (r) => (
        <span className="text-xs font-medium text-[color:var(--fd-primary)]">
          {r.status === DepositStatus.PENDING_VALIDATION
            ? t("admin_deposits_pending")
            : r.status}
        </span>
      ),
    },
    {
      id: "amount",
      header: "USDT",
      sortable: true,
      sortValue: (r) => Number(r.declaredAmountUsdt ?? r.amount ?? 0) || 0,
      cell: (r) => (
        <span className="font-mono text-xs text-[color:var(--fd-muted)]">
          {r.declaredAmountUsdt
            ? `${r.declaredAmountUsdt} USDT`
            : r.amount
              ? r.amount
              : "—"}
        </span>
      ),
    },
    {
      id: "when",
      header: t("admin_audit_when"),
      sortable: true,
      sortValue: (r) => new Date(r.createdAt).getTime(),
      align: "right",
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-[color:var(--fd-muted)]">
          {new Date(r.createdAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
        </span>
      ),
    },
  ];

  if (rows === null) {
    return <p className={adminCls.muted}>…</p>;
  }

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_deposits_queue")}
        action={
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={adminCls.select}
          >
            <option value="pending">{t("admin_deposits_pending")}</option>
            <option value="done">{t("admin_deposits_done")}</option>
            <option value="all">{t("admin_all")}</option>
          </select>
        }
      />
      {err ? <p className={adminCls.error}>{err}</p> : null}

      <AdminSnapshotRow
        items={[
          {
            label: t("admin_deposits_queue"),
            value: rows.length,
          },
        ]}
      />

      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage={t("admin_deposits_empty")}
        initialSortId="when"
        initialSortDir="desc"
        totalLabel={t("admin_table_total", { count: rows.length })}
      />
    </div>
  );
}
