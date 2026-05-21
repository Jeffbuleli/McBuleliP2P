import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb, groupSavingsGroups, p2pOrders, users, withdrawals } from "@/db";
import { WithdrawalStatus } from "@/lib/status";

export type AdminDashboardStats = {
  withdrawalsPendingAgent: number;
  withdrawalsPendingUnassigned: number;
  withdrawalsProcessing: number;
  groupsPendingReview: number;
  groupsSubscriptionOverdue: number;
  p2pDisputesOpen: number;
  usersRegisteredLast7Days: number;
  totalUsers: number;
  totalAgents: number;
  totalSuperAdmins: number;
};

function intFromCount(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Read-only counters for the ops dashboard (no new tables).
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const db = getDb();

  const [wPend] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(withdrawals)
    .where(eq(withdrawals.status, WithdrawalStatus.PENDING_AGENT));

  const [wUn] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.status, WithdrawalStatus.PENDING_AGENT),
        isNull(withdrawals.assignedToUserId),
      ),
    );

  const [wProc] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(withdrawals)
    .where(eq(withdrawals.status, WithdrawalStatus.PROCESSING));

  const [gPending] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.status, "pending"));

  const [gOverdue] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(groupSavingsGroups)
    .where(
      and(
        eq(groupSavingsGroups.subscriptionStatus, "overdue"),
        inArray(groupSavingsGroups.status, ["approved", "active"]),
      ),
    );

  const [p2pD] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(p2pOrders)
    .where(eq(p2pOrders.status, "disputed"));

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [reg] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(gte(users.createdAt, weekAgo));

  const [totalU] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users);
  const [totalAgents] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "agent"));
  const [totalSuper] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "super_admin"));

  return {
    withdrawalsPendingAgent: intFromCount(wPend?.c),
    withdrawalsPendingUnassigned: intFromCount(wUn?.c),
    withdrawalsProcessing: intFromCount(wProc?.c),
    groupsPendingReview: intFromCount(gPending?.c),
    groupsSubscriptionOverdue: intFromCount(gOverdue?.c),
    p2pDisputesOpen: intFromCount(p2pD?.c),
    usersRegisteredLast7Days: intFromCount(reg?.c),
    totalUsers: intFromCount(totalU?.c),
    totalAgents: intFromCount(totalAgents?.c),
    totalSuperAdmins: intFromCount(totalSuper?.c),
  };
}
