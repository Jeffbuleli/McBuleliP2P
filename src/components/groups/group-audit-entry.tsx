"use client";

import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

const AUDIT_ACTION_KEYS: Record<string, keyof Messages> = {
  group_created: "group_audit_group_created",
  ops_approved_group: "group_audit_ops_approved",
  member_requested_join: "group_audit_member_requested",
  member_approved: "group_audit_member_approved",
  member_rejected: "group_audit_member_rejected",
  co_admins_updated: "group_audit_co_admins_updated",
  contribution_made: "group_audit_contribution_made",
  payout_sent: "group_audit_payout_sent",
  group_profile_updated: "group_audit_profile_updated",
  subscription_paid: "group_audit_subscription_paid",
  subscription_failed_insufficient_balance: "group_audit_subscription_failed",
  ops_rejected_group: "group_audit_ops_rejected",
  member_revoked: "group_audit_member_revoked",
  member_role_updated: "group_audit_member_role_updated",
};

export function groupAuditLabel(
  t: (k: keyof Messages) => string,
  action: string,
): string {
  const key = AUDIT_ACTION_KEYS[action?.trim() ?? ""];
  return key ? t(key) : action;
}

export function GroupAuditEntry({
  action,
  createdAt,
  locale,
}: {
  action: string;
  createdAt: string;
  locale: string;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <li className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-950">
      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
        {groupAuditLabel(t, action)}
      </p>
      <p className="mt-1 text-[11px] text-stone-500">
        {new Date(createdAt).toLocaleString(loc)}
      </p>
    </li>
  );
}
