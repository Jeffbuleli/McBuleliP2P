"use client";

import { adminCls } from "@/components/admin/admin-ui";
import { memberRoleSummary } from "@/lib/group-role-label";
import { AvecMemberTrustBadge } from "@/components/groups/avec-member-trust-badge";
import { useI18n } from "@/components/i18n-provider";

import { p2pDisplayName } from "@/lib/p2p-display";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";

import type { GranularRoleId } from "@/lib/avec/governance/granular-roles";

export type AvecMemberRow = {
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
  granularRoles?: GranularRoleId[];
  kycApproved?: boolean;
  savedUsdt?: number;
  meetingsPaid?: number;
  sharesTotal?: number;
};

export function AvecMemberList({
  members,
  canModerate,
  busy,
  onReview,
}: {
  members: AvecMemberRow[];
  canModerate: boolean;
  busy: boolean;
  onReview: (userId: string, accept: boolean) => void;
}) {
  const { t } = useI18n();
  const approved = members.filter((m) => m.status === "approved");
  const pending = members.filter((m) => m.status === "pending");

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-[color:var(--fd-border)]">
        <table className="admin-table w-full">
          <thead>
            <tr>
              <th>{t("avec_col_member")}</th>
              <th>{t("avec_col_role")}</th>
              <th className="text-right">{t("avec_col_saved")}</th>
              <th className="text-right">{t("avec_col_parts")}</th>
            </tr>
          </thead>
          <tbody>
            {approved.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-xs text-[color:var(--fd-muted)]">
                  {t("avec_members_empty")}
                </td>
              </tr>
            ) : (
              approved.map((m) => (
                <tr key={m.userId}>
                  <td>
                    <p className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold text-[color:var(--fd-text)]">
                      <span className="truncate">
                        {p2pDisplayName({
                          email: m.email,
                          displayName: m.displayName ?? null,
                          avatarUrl: null,
                          piUsername: null,
                        })}
                      </span>
                      {m.kycApproved ? <KycVerifiedBadge compact /> : null}
                    </p>
                  </td>
                  <td>
                    <div className="flex flex-col items-start gap-0.5">
                      <span className={adminCls.roleBadge}>
                        {memberRoleSummary(t, {
                          role: m.role,
                          granularRoles: m.granularRoles,
                        })}
                      </span>
                      <AvecMemberTrustBadge
                        meetingsPaid={m.meetingsPaid}
                        sharesTotal={m.sharesTotal}
                        kycApproved={m.kycApproved}
                      />
                    </div>
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums">
                    {(m.savedUsdt ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right font-mono text-xs tabular-nums text-[color:var(--fd-muted)]">
                    {m.sharesTotal ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canModerate && pending.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("group_dash_pending_members")}
          </p>
          <ul className="space-y-2">
            {pending.map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--fd-border)] px-3 py-2"
              >
                <span className="min-w-0 truncate text-xs font-medium">
                  {p2pDisplayName({
                    email: m.email,
                    displayName: m.displayName ?? null,
                    avatarUrl: null,
                    piUsername: null,
                  })}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReview(m.userId, true)}
                    className="rounded-lg bg-[color:var(--fd-primary)] px-2.5 py-1 text-[10px] font-bold text-white disabled:opacity-50"
                  >
                    {t("group_accept")}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onReview(m.userId, false)}
                    className="rounded-lg border border-rose-200 px-2.5 py-1 text-[10px] font-bold text-rose-700 disabled:opacity-50"
                  >
                    {t("group_reject")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
