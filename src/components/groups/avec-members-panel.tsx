"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ListPagination, useListPagination } from "@/components/ui/list-pagination";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import { adminCls } from "@/components/admin/admin-ui";
import { p2pDisplayName } from "@/lib/p2p-display";
import { clientErrorText } from "@/lib/client-error-text";
import { groupRoleLabel } from "@/lib/group-role-label";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";

export function AvecMembersPanel({
  groupId,
  members,
  canModerate,
  canAdmin,
  busy,
  onRefresh,
}: {
  groupId: string;
  members: AvecMemberRow[];
  canModerate: boolean;
  canAdmin: boolean;
  busy: boolean;
  onRefresh: () => void;
}) {
  const { t } = useI18n();
  const [err, setErr] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const approved = members.filter((m) => m.status === "approved");
  const pending = members.filter((m) => m.status === "pending");
  const pag = useListPagination(approved, 10);

  const loadInvite = useCallback(async () => {
    if (!canModerate) return;
    const res = await fetch(`/api/groups/${groupId}/invite`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setInviteUrl((j as { inviteUrl?: string }).inviteUrl ?? null);
    }
  }, [groupId, canModerate]);

  useEffect(() => {
    void loadInvite();
  }, [loadInvite]);

  async function memberAction(
    userId: string,
    body: { action: "review"; accept: boolean } | { action: "revoke" } | { action: "role"; role: "member" | "co_admin" },
  ) {
    setErr(null);
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "group_action_failed");
      return;
    }
    onRefresh();
  }

  async function copyInvite() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr("group_action_failed");
    }
  }

  return (
    <div className="space-y-3">
      {canModerate ? (
        <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 p-3">
          <p className="text-xs font-bold text-[color:var(--fd-text)]">{t("avec_invite_title")}</p>
          <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">{t("avec_invite_hint")}</p>
          {inviteUrl ? (
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="min-w-0 flex-1 rounded-lg border border-[color:var(--fd-border)] bg-white px-2 py-1.5 text-[10px] font-mono"
              />
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="shrink-0 rounded-lg bg-[color:var(--fd-primary)] px-3 py-1.5 text-[10px] font-bold text-white"
              >
                {copied ? t("avec_invite_copied") : t("avec_invite_copy")}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-[10px] text-[color:var(--fd-muted)]">…</p>
          )}
        </div>
      ) : null}

      {err ? (
        <p className="rounded-lg bg-rose-50 px-2 py-1 text-xs text-rose-800">
          {clientErrorText(t, err)}
        </p>
      ) : null}

      {canModerate && pending.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("group_dash_pending_members")}
          </p>
          {pending.map((m) => (
            <div
              key={m.userId}
              className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatarMark
                  email={m.email}
                  avatarUrl={m.avatarUrl ?? null}
                  sizeClass="h-8 w-8"
                />
                <span className="truncate text-xs font-medium">
                  {p2pDisplayName({
                    email: m.email,
                    displayName: m.displayName ?? null,
                    avatarUrl: m.avatarUrl ?? null,
                    piUsername: null,
                  })}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void memberAction(m.userId, { action: "review", accept: true })}
                  className="rounded-lg bg-[color:var(--fd-primary)] px-2 py-1 text-[10px] font-bold text-white"
                >
                  {t("group_accept")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void memberAction(m.userId, { action: "review", accept: false })}
                  className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700"
                >
                  {t("group_reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>{t("avec_col_member")}</th>
              <th>{t("avec_col_role")}</th>
              <th className="text-right">{t("avec_col_saved")}</th>
              {canAdmin ? <th /> : null}
            </tr>
          </thead>
          <tbody>
            {pag.slice.length === 0 ? (
              <tr>
                <td colSpan={canAdmin ? 4 : 3} className="py-6 text-center text-xs text-[color:var(--fd-muted)]">
                  {t("avec_members_empty")}
                </td>
              </tr>
            ) : (
              pag.slice.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <UserAvatarMark
                        email={m.email}
                        avatarUrl={m.avatarUrl ?? null}
                        sizeClass="h-7 w-7"
                      />
                      <span className="truncate text-xs font-semibold">
                        {p2pDisplayName({
                          email: m.email,
                          displayName: m.displayName ?? null,
                          avatarUrl: m.avatarUrl ?? null,
                          piUsername: null,
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    {canAdmin && m.role !== "admin" ? (
                      <select
                        value={m.role === "co_admin" ? "co_admin" : "member"}
                        disabled={busy}
                        onChange={(e) =>
                          void memberAction(m.userId, {
                            action: "role",
                            role: e.target.value as "member" | "co_admin",
                          })
                        }
                        className="rounded border border-[color:var(--fd-border)] px-1 py-0.5 text-[10px]"
                      >
                        <option value="member">{t("group_settings_role_member")}</option>
                        <option value="co_admin">{t("group_settings_role_coadmin")}</option>
                      </select>
                    ) : (
                      <span className={adminCls.roleBadge}>{groupRoleLabel(t, m.role)}</span>
                    )}
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {(m.savedUsdt ?? 0).toFixed(2)}
                  </td>
                  {canAdmin ? (
                    <td className="text-right">
                      {m.role !== "admin" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void memberAction(m.userId, { action: "revoke" })}
                          className="text-[10px] font-bold text-rose-600"
                        >
                          {t("avec_member_revoke")}
                        </button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-2 pb-2">
          <ListPagination
            page={pag.page}
            pageSize={pag.pageSize}
            totalPages={pag.totalPages}
            total={pag.total}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
          />
        </div>
      </div>
    </div>
  );
}
