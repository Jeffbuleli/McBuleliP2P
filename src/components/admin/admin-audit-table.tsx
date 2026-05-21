"use client";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { useI18n } from "@/components/i18n-provider";

export type AdminAuditRow = {
  id: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  meta: unknown;
  createdAt: string;
  actorEmail: string | null;
};

export function AdminAuditTable({ rows }: { rows: AdminAuditRow[] }) {
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const columns: AdminTableColumn<AdminAuditRow>[] = [
    {
      id: "when",
      header: t("admin_audit_when"),
      sortable: true,
      sortValue: (r) => new Date(r.createdAt).getTime(),
      cell: (r) => (
        <span className="whitespace-nowrap text-xs text-[color:var(--fd-muted)]">
          {new Date(r.createdAt).toLocaleString(loc)}
        </span>
      ),
    },
    {
      id: "actor",
      header: t("admin_audit_actor"),
      sortable: true,
      sortValue: (r) => r.actorEmail ?? "",
      cell: (r) => (
        <span className="max-w-[140px] break-all font-mono text-xs">{r.actorEmail ?? "—"}</span>
      ),
    },
    {
      id: "action",
      header: t("admin_audit_action"),
      sortable: true,
      sortValue: (r) => r.action,
      cell: (r) => (
        <span className="text-xs font-medium text-[color:var(--fd-primary)]">{r.action}</span>
      ),
    },
    {
      id: "resource",
      header: t("admin_audit_resource"),
      sortable: true,
      sortValue: (r) => `${r.resourceType ?? ""}:${r.resourceId ?? ""}`,
      cell: (r) => (
        <span className="max-w-[120px] break-all font-mono text-[11px] text-[color:var(--fd-muted)]">
          {r.resourceType ?? "—"}
          {r.resourceId ? (
            <>
              <br />
              <span className="opacity-80">{r.resourceId}</span>
            </>
          ) : null}
        </span>
      ),
    },
    {
      id: "meta",
      header: t("admin_audit_details"),
      cell: (r) => (
        <span className="max-w-md font-mono text-[11px] text-[color:var(--fd-muted)]">
          {r.meta ? JSON.stringify(r.meta) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <AdminSnapshotRow
        items={[
          {
            label: t("admin_audit_title"),
            value: rows.length,
          },
        ]}
      />
      <AdminDataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage={t("admin_audit_empty")}
        initialSortId="when"
        initialSortDir="desc"
        totalLabel={t("admin_table_total", { count: rows.length })}
      />
    </div>
  );
}
