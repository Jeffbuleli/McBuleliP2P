"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  STAFF_SCOPES,
  type StaffScope,
  isStaffScope,
} from "@/lib/staff-scopes";
import {
  AdminDataTable,
  type AdminTableColumn,
} from "@/components/admin/admin-data-table";
import { AdminSnapshotRow } from "@/components/admin/admin-snapshot-row";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type U = {
  id: string;
  email: string;
  role: string;
  staffScopes: string[] | null;
  createdAt: string;
};

function scopesToSelection(raw: string[] | null | undefined): Set<StaffScope> {
  if (raw === null || raw === undefined) {
    return new Set(STAFF_SCOPES);
  }
  const out = new Set<StaffScope>();
  for (const x of raw) {
    if (isStaffScope(x)) out.add(x);
  }
  return out;
}

function selectionToPayload(s: Set<StaffScope>): StaffScope[] | null {
  const allOn = STAFF_SCOPES.every((x) => s.has(x));
  if (allOn) return null;
  return STAFF_SCOPES.filter((x) => s.has(x));
}

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<U[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [scopeSel, setScopeSel] = useState<Record<string, Set<StaffScope>>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.message ?? "—");
      setUsers([]);
      return;
    }
    const list = data.users as U[];
    setUsers(list);
    const next: Record<string, Set<StaffScope>> = {};
    for (const u of list) {
      next[u.id] = scopesToSelection(u.staffScopes);
    }
    setScopeSel(next);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const list = users ?? [];
    return {
      all: list.length,
      user: list.filter((u) => u.role === "user").length,
      agent: list.filter((u) => u.role === "agent").length,
      super: list.filter((u) => u.role === "super_admin").length,
    };
  }, [users]);

  async function setRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? "—");
      return;
    }
    const data = await res.json();
    setUsers((prev) =>
      prev
        ? prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  role: data.user.role,
                  staffScopes: data.user.staffScopes ?? null,
                }
              : u,
          )
        : prev,
    );
    if (role === "agent") {
      setScopeSel((prev) => ({
        ...prev,
        [userId]: scopesToSelection(data.user.staffScopes),
      }));
    }
  }

  async function saveScopes(userId: string, role: string) {
    if (role !== "agent") return;
    const sel = scopeSel[userId];
    if (!sel) return;
    const staffScopes = selectionToPayload(sel);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "agent", staffScopes }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.message ?? "—");
      return;
    }
    const data = await res.json();
    setUsers((prev) =>
      prev
        ? prev.map((u) =>
            u.id === userId
              ? { ...u, staffScopes: data.user.staffScopes ?? null }
              : u,
          )
        : prev,
    );
  }

  function toggleScope(userId: string, scope: StaffScope) {
    setScopeSel((prev) => {
      const cur = new Set(prev[userId] ?? scopesToSelection(null));
      if (cur.has(scope)) cur.delete(scope);
      else cur.add(scope);
      return { ...prev, [userId]: cur };
    });
  }

  const columns: AdminTableColumn<U>[] = [
    {
      id: "email",
      header: t("admin_team_col_email"),
      sortable: true,
      sortValue: (u) => u.email,
      cell: (u) => (
        <div>
          <p className="font-medium text-[color:var(--fd-text)]">{u.email}</p>
          <p className="font-mono text-[10px] text-[color:var(--fd-muted)]">{u.id}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: t("admin_role"),
      sortable: true,
      sortValue: (u) => u.role,
      cell: (u) => (
        <select
          value={u.role}
          onChange={(e) => void setRole(u.id, e.target.value)}
          className={adminCls.select}
          aria-label={t("admin_role")}
        >
          <option value="user">{t("admin_role_option_user")}</option>
          <option value="agent">{t("admin_role_option_agent")}</option>
          <option value="super_admin">{t("admin_role_option_super_admin")}</option>
        </select>
      ),
    },
    {
      id: "created",
      header: t("admin_team_col_since"),
      sortable: true,
      sortValue: (u) => new Date(u.createdAt).getTime(),
      cell: (u) => (
        <span className="text-xs text-[color:var(--fd-muted)]">
          {new Date(u.createdAt).toLocaleDateString(loc, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (u) =>
        u.role === "agent" ? (
          <button
            type="button"
            onClick={() => setExpandedId((id) => (id === u.id ? null : u.id))}
            className={adminCls.btnSecondary}
          >
            {expandedId === u.id ? t("admin_users_collapse") : t("admin_users_expand")}
          </button>
        ) : null,
    },
  ];

  const expanded = users?.find((u) => u.id === expandedId);

  if (users === null) {
    return <p className={adminCls.muted}>…</p>;
  }

  return (
    <div className={adminCls.page}>
      <AdminPageHeader
        title={t("admin_users")}
        action={<AdminBackLink>{t("admin_back")}</AdminBackLink>}
      />
      <p className={`text-xs ${adminCls.muted}`}>{t("admin_agent_full_access_hint")}</p>
      {err ? <p className={adminCls.error}>{err}</p> : null}

      <AdminSnapshotRow
        items={[
          { label: t("admin_kpi_total_users"), value: totals.all },
          { label: t("admin_role_option_user"), value: totals.user, tone: "neutral" },
          { label: t("admin_kpi_total_agents"), value: totals.agent },
          {
            label: t("admin_kpi_total_super_admins"),
            value: totals.super,
            tone: "neutral",
          },
        ]}
      />

      <AdminDataTable
        rows={users}
        columns={columns}
        rowKey={(u) => u.id}
        emptyMessage="—"
        initialSortId="email"
        totalLabel={t("admin_table_total", { count: users.length })}
      />

      {expanded?.role === "agent" ? (
        <div className={`${adminCls.card} space-y-3`}>
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{expanded.email}</p>
          <p className={`text-xs font-semibold uppercase ${adminCls.muted}`}>
            {t("admin_agent_modules")}
          </p>
          <div className={`flex flex-col gap-2 text-sm ${adminCls.muted}`}>
            {(
              [
                ["withdrawals", t("admin_agent_scope_withdrawals")] as const,
                ["groups", t("admin_agent_scope_groups")] as const,
                ["p2p_disputes", t("admin_agent_scope_p2p")] as const,
                ["platform_expenses", t("admin_agent_scope_platform_expenses")] as const,
                [
                  "platform_expenses_approve",
                  t("admin_agent_scope_platform_expenses_approve"),
                ] as const,
                ["landing_ads", t("admin_agent_scope_landing_ads")] as const,
              ] as const
            ).map(([scope, label]) => (
              <label key={scope} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={(
                    scopeSel[expanded.id] ?? scopesToSelection(expanded.staffScopes)
                  ).has(scope)}
                  onChange={() => toggleScope(expanded.id, scope)}
                />
                {label}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void saveScopes(expanded.id, expanded.role)}
            className={adminCls.btnPrimary}
          >
            {t("admin_save_modules")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
