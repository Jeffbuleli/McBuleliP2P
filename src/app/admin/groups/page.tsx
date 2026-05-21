"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type Row = {
  id: string;
  type: string;
  name: string;
  status: string;
  subscriptionStatus: string;
  contributionAmountUsdt: string;
  cycleDurationDays: number;
  countryCode: string | null;
  createdAt: string;
  createdByEmail: string;
};

function AdminGroupsContent() {
  const { t, locale } = useI18n();
  const sp = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState(() => sp.get("status") ?? "pending");
  const [subscriptionStatus, setSubscriptionStatus] = useState(
    () => sp.get("subscriptionStatus") ?? "",
  );

  useEffect(() => {
    setErr(null);
    void (async () => {
      const q = new URLSearchParams();
      q.set("status", status);
      if (subscriptionStatus) {
        q.set("subscriptionStatus", subscriptionStatus);
      }
      const res = await fetch(`/api/admin/groups?${q.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.message ?? "…");
        setRows([]);
        return;
      }
      setRows((data.groups ?? []) as Row[]);
    })();
  }, [status, subscriptionStatus]);

  const columns: AdminTableColumn<Row>[] = [
    {
      id: "name",
      header: t("admin_groups"),
      sortable: true,
      sortValue: (r) => r.name,
      cell: (r) => (
        <Link
          href={`/admin/groups/${r.id}`}
          className="font-medium text-[color:var(--fd-primary)] hover:underline"
        >
          <span className="mr-1 rounded bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[10px] font-bold uppercase">
            {r.type}
          </span>
          {r.name}
        </Link>
      ),
    },
    {
      id: "creator",
      header: t("admin_team_col_email"),
      sortable: true,
      sortValue: (r) => r.createdByEmail,
      cell: (r) => (
        <span className="text-xs text-[color:var(--fd-muted)]">{r.createdByEmail}</span>
      ),
    },
    {
      id: "status",
      header: t("admin_status"),
      sortable: true,
      sortValue: (r) => `${r.status}:${r.subscriptionStatus}`,
      cell: (r) => (
        <span className="text-xs font-medium text-[color:var(--fd-primary)]">
          {r.status} · {r.subscriptionStatus}
        </span>
      ),
    },
    {
      id: "contrib",
      header: "USDT",
      sortable: true,
      sortValue: (r) => Number(r.contributionAmountUsdt) || 0,
      cell: (r) => (
        <span className="font-mono text-xs text-[color:var(--fd-muted)]">
          {r.contributionAmountUsdt} · {r.cycleDurationDays}d
          {r.countryCode ? ` · ${countryLabel(locale, r.countryCode)}` : ""}
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

  if (rows === null) return <p className={adminCls.muted}>…</p>;

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_groups")}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={adminCls.select}
          aria-label={t("admin_status")}
        >
          <option value="pending">{t("admin_pending")}</option>
          <option value="approved">{t("admin_approved")}</option>
          <option value="active">{t("admin_active")}</option>
          <option value="approved,active">{t("admin_groups_lifecycle_approved_active")}</option>
          <option value="suspended">{t("admin_suspended")}</option>
          <option value="rejected">{t("admin_rejected")}</option>
          <option value="all">{t("admin_all")}</option>
        </select>
        <select
          value={subscriptionStatus}
          onChange={(e) => setSubscriptionStatus(e.target.value)}
          className={adminCls.select}
          aria-label={t("admin_subscription")}
        >
          <option value="">{t("admin_groups_sub_any")}</option>
          <option value="active">{t("admin_subscription_state_active")}</option>
          <option value="overdue">{t("admin_subscription_state_overdue")}</option>
          <option value="suspended">{t("admin_subscription_state_suspended")}</option>
        </select>
      </div>
      {err ? <p className={adminCls.error}>{err}</p> : null}

      <AdminSnapshotRow
        items={[
          {
            label: t("admin_groups"),
            value: rows.length,
          },
        ]}
      />

      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage="—"
        initialSortId="when"
        initialSortDir="desc"
        totalLabel={t("admin_table_total", { count: rows.length })}
      />
    </div>
  );
}

export default function AdminGroupsPage() {
  return (
    <Suspense fallback={<p className={adminCls.muted}>…</p>}>
      <AdminGroupsContent />
    </Suspense>
  );
}
