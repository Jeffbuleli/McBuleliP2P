import { getDb, platformAdminAuditLog } from "@/db";

/** Stable action keys for filtering / reporting. */
export const PlatformAdminAuditAction = {
  USER_ROLE_UPDATE: "user.role_update",
  WITHDRAWAL_CLAIM: "withdrawal.claim",
  WITHDRAWAL_COMPLETE: "withdrawal.complete",
  WITHDRAWAL_REJECT: "withdrawal.reject",
  DEPOSIT_APPROVE: "deposit.approve",
  DEPOSIT_REJECT: "deposit.reject",
  GROUP_REVIEW: "group.review",
  GROUP_SUBSCRIPTION_BILLING_RUN: "group.subscription_billing_run",
  P2P_DISPUTE_RESOLVE: "p2p.dispute_resolve",
  PLATFORM_EXPENSE_CREATE: "platform_expense.create",
  PLATFORM_EXPENSE_UPDATE: "platform_expense.update",
  PLATFORM_EXPENSE_SUBMIT: "platform_expense.submit",
  PLATFORM_EXPENSE_APPROVE: "platform_expense.approve",
  PLATFORM_EXPENSE_REJECT: "platform_expense.reject",
  PLATFORM_EXPENSE_PAID: "platform_expense.paid",
  MCB_CLAIM_COMPLETE: "mcb_claim.complete",
  MCB_CLAIM_REJECT: "mcb_claim.reject",
  TRADE_LIVE_UPDATE: "trade.live_update",
  KYC_IDENTITY_CORRECTION: "kyc.identity_correction",
} as const;

export async function writePlatformAdminAudit(args: {
  actorUserId: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<void> {
  const db = getDb();
  await db.insert(platformAdminAuditLog).values({
    actorUserId: args.actorUserId,
    action: args.action,
    resourceType: args.resourceType ?? null,
    resourceId: args.resourceId ?? null,
    meta: args.meta ?? null,
  });
}
