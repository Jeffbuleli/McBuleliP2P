"use client";

import Link from "next/link";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls } from "@/components/admin/admin-ui";
import { useI18n } from "@/components/i18n-provider";

export type AdminTeamRow = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
};

export function AdminTeamTable({ rows }: { rows: AdminTeamRow[] }) {
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const agents = rows.filter((r) => r.role === "agent").length;
  const supers = rows.filter((r) => r.role === "super_admin").length;

  const columns: AdminTableColumn<AdminTeamRow>[] = [
    {
      id: "email",
      header: t("admin_team_col_email"),
      sortable: true,
      sortValue: (r) => r.email,
      cell: (r) => <span className="font-mono text-xs">{r.email}</span>,
    },
    {
      id: "role",
      header: t("admin_team_col_role"),
      sortable: true,
      sortValue: (r) => r.role,
      cell: (r) => <span className={adminCls.roleBadge}>{r.role}</span>,
    },
    {
      id: "since",
      header: t("admin_team_col_since"),
      sortable: true,
      sortValue: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => (
        <span className="text-xs text-[color:var(--fd-muted)]">
          {new Date(r.createdAt).toLocaleDateString(loc, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminSnapshotRow
        items={[
          { label: t("admin_team_title"), value: rows.length },
          { label: t("admin_kpi_total_agents"), value: agents },
          {
            label: t("admin_kpi_total_super_admins"),
            value: supers,
            tone: "neutral",
          },
        ]}
      />
      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage={t("admin_team_empty")}
        initialSortId="email"
        totalLabel={t("admin_table_total", { count: rows.length })}
        toolbar={
          <Link href="/admin/users" className={adminCls.back}>
            {t("admin_team_manage_users")} →
          </Link>
        }
      />
    </div>
  );
}
