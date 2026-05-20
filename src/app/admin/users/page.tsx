"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  STAFF_SCOPES,
  type StaffScope,
  isStaffScope,
} from "@/lib/staff-scopes";
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
  const { t } = useI18n();
  const [users, setUsers] = useState<U[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [scopeSel, setScopeSel] = useState<Record<string, Set<StaffScope>>>({});

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
      <ul className="space-y-4">
        {users.map((u) => (
          <li key={u.id} className={adminCls.card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[color:var(--fd-text)]">{u.email}</p>
                <p className={`text-xs ${adminCls.muted}`}>{u.id}</p>
              </div>
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
            </div>
            {u.role === "agent" ? (
              <div className="mt-3 border-t border-[color:var(--fd-border)] pt-3">
                <p className={`mb-2 text-xs font-semibold uppercase ${adminCls.muted}`}>
                  {t("admin_agent_modules")}
                </p>
                <div className={`flex flex-col gap-2 text-sm ${adminCls.muted}`}>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(scopeSel[u.id] ?? scopesToSelection(u.staffScopes)).has(
                        "withdrawals",
                      )}
                      onChange={() => toggleScope(u.id, "withdrawals")}
                    />
                    {t("admin_agent_scope_withdrawals")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(scopeSel[u.id] ?? scopesToSelection(u.staffScopes)).has(
                        "groups",
                      )}
                      onChange={() => toggleScope(u.id, "groups")}
                    />
                    {t("admin_agent_scope_groups")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(scopeSel[u.id] ?? scopesToSelection(u.staffScopes)).has(
                        "p2p_disputes",
                      )}
                      onChange={() => toggleScope(u.id, "p2p_disputes")}
                    />
                    {t("admin_agent_scope_p2p")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(scopeSel[u.id] ?? scopesToSelection(u.staffScopes)).has(
                        "platform_expenses",
                      )}
                      onChange={() => toggleScope(u.id, "platform_expenses")}
                    />
                    {t("admin_agent_scope_platform_expenses")}
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(scopeSel[u.id] ?? scopesToSelection(u.staffScopes)).has(
                        "platform_expenses_approve",
                      )}
                      onChange={() => toggleScope(u.id, "platform_expenses_approve")}
                    />
                    {t("admin_agent_scope_platform_expenses_approve")}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void saveScopes(u.id, u.role)}
                  className={`mt-3 ${adminCls.btnPrimary}`}
                >
                  {t("admin_save_modules")}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
