import { getDb, platformAdminAuditLog } from "@/db";

/** Stable action keys for filtering / reporting. */
export const PlatformAdminAuditAction = {
  USER_ROLE_UPDATE: "user.role_update",
  WITHDRAWAL_CLAIM: "withdrawal.claim",
  WITHDRAWAL_COMPLETE: "withdrawal.complete",
  WITHDRAWAL_REJECT: "withdrawal.reject",
  GROUP_REVIEW: "group.review",
  GROUP_SUBSCRIPTION_BILLING_RUN: "group.subscription_billing_run",
  P2P_DISPUTE_RESOLVE: "p2p.dispute_resolve",
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
