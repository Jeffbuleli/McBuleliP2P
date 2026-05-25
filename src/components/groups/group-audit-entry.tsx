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
  payout_proposed: "group_audit_payout_proposed",
  payout_approved: "group_audit_payout_approved",
  loan_proposed: "group_audit_loan_proposed",
  loan_approved: "group_audit_loan_approved",
  loan_disbursed: "group_audit_loan_disbursed",
  loan_repaid: "group_audit_loan_repaid",
  loan_requested: "group_audit_loan_requested",
  loan_request_accepted: "group_audit_loan_request_accepted",
  loan_rejected: "group_audit_loan_rejected",
  payout_rejected: "group_audit_payout_rejected",
  cycle_closure_proposed: "group_audit_cycle_closure_proposed",
  cycle_closure_approved: "group_audit_cycle_closure_approved",
  cycle_closed: "group_audit_cycle_closed",
  cycle_started: "group_audit_cycle_started",
  group_profile_updated: "group_audit_profile_updated",
  subscription_paid: "group_audit_subscription_paid",
  subscription_failed_insufficient_balance: "group_audit_subscription_failed",
  ops_rejected_group: "group_audit_ops_rejected",
  member_revoked: "group_audit_member_revoked",
  member_role_updated: "group_audit_member_role_updated",
  gov_mode_changed: "group_audit_gov_mode_changed",
  gov_proposal_created: "group_audit_gov_proposal_created",
  gov_vote_cast: "group_audit_gov_vote_cast",
  gov_vote_closed: "group_audit_gov_vote_closed",
  gov_admin_revoked: "group_audit_gov_admin_revoked",
  gov_interest_rate_changed: "group_audit_gov_interest_rate_changed",
  gov_payout_executed: "group_audit_gov_payout_executed",
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
  variant = "stone",
}: {
  action: string;
  createdAt: string;
  locale: string;
  variant?: "stone" | "fd";
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const cls =
    variant === "fd"
      ? "rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2"
      : "rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700 dark:bg-stone-950";

  const titleCls =
    variant === "fd"
      ? "text-xs font-semibold text-[color:var(--fd-text)]"
      : "text-sm font-semibold text-stone-800 dark:text-stone-200";

  const timeCls =
    variant === "fd"
      ? "mt-1 text-[10px] text-[color:var(--fd-muted)]"
      : "mt-1 text-[11px] text-stone-500";

  return (
    <li className={cls}>
      <p className={titleCls}>{groupAuditLabel(t, action)}</p>
      <p className={timeCls}>{new Date(createdAt).toLocaleString(loc)}</p>
    </li>
  );
}
