import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupAvecLoans,
  groupCycleClosureApprovals,
  groupCycleClosureRequests,
  groupPayoutRequests,
  groupSavingsGroups,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import {
  fundBucketMeta,
  getGroupFundSummary,
  getGroupLentUsdt,
} from "@/lib/avec/fund-buckets";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import { insertGroupClosureDecisionMessage } from "@/lib/group-savings-messaging";
import {
  getMemberContributionStats,
  type MemberContributionStat,
} from "@/lib/group-savings-member-stats";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import {
  listGroupManagers,
  payoutRequiredApprovals,
  type PayoutApprover,
} from "@/lib/group-savings-payouts";
import { p2pDisplayName } from "@/lib/p2p-display";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export type ClosureMemberLine = {
  userId: string;
  displayName: string;
  sharesTotal: number;
  contributedUsdt: number;
  payoutUsdt: number;
  gainUsdt: number;
};

export type ClosureSnapshot = {
  cycleNumber: number;
  shareValueUsdt: number;
  totalShares: number;
  distributableUsdt: number;
  savingsUsdt: number;
  socialUsdt: number;
  adminUsdt: number;
  lentUsdt: number;
  finalShareValueUsdt: number;
  members: ClosureMemberLine[];
};

async function userDisplayName(userId: string): Promise<string> {
  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      piUsername: users.piUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return userId.slice(0, 8);
  return p2pDisplayName({
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    piUsername: u.piUsername,
  });
}

function cycleStartedAt(g: {
  cycleStartedAt: Date | null;
  createdAt: Date;
}): Date {
  return g.cycleStartedAt ?? g.createdAt;
}

export function buildClosureSnapshot(args: {
  cycleNumber: number;
  shareValueUsdt: number;
  funds: Awaited<ReturnType<typeof getGroupFundSummary>>;
  stats: MemberContributionStat[];
  displayNames: Map<string, string>;
}):
  | { ok: true; snapshot: ClosureSnapshot }
  | { ok: false; message: string } {
  const withShares = args.stats.filter((s) => s.sharesTotal > 0);
  const totalShares = withShares.reduce((s, m) => s + m.sharesTotal, 0);
  if (totalShares <= 0) return { ok: false, message: "group_closure_no_shares" };

  const distributableUsdt = args.funds.availableUsdt;
  if (distributableUsdt <= 0) {
    return { ok: false, message: "group_closure_nothing_to_distribute" };
  }

  const finalShareValueUsdt = distributableUsdt / totalShares;
  const members: ClosureMemberLine[] = [];
  let allocated = 0;

  for (let i = 0; i < withShares.length; i++) {
    const s = withShares[i]!;
    const displayName = args.displayNames.get(s.userId) ?? s.userId.slice(0, 8);
    let payoutUsdt: number;
    if (i === withShares.length - 1) {
      payoutUsdt = Math.max(0, distributableUsdt - allocated);
    } else {
      payoutUsdt = (s.sharesTotal / totalShares) * distributableUsdt;
      payoutUsdt = Math.floor(payoutUsdt * 1e6) / 1e6;
      allocated += payoutUsdt;
    }
    members.push({
      userId: s.userId,
      displayName,
      sharesTotal: s.sharesTotal,
      contributedUsdt: s.totalUsdt,
      payoutUsdt,
      gainUsdt: payoutUsdt - s.totalUsdt,
    });
  }

  return {
    ok: true,
    snapshot: {
      cycleNumber: args.cycleNumber,
      shareValueUsdt: args.shareValueUsdt,
      totalShares,
      distributableUsdt,
      savingsUsdt: args.funds.savingsUsdt,
      socialUsdt: args.funds.socialUsdt,
      adminUsdt: args.funds.adminUsdt,
      lentUsdt: args.funds.lentUsdt,
      finalShareValueUsdt,
      members,
    },
  };
}

async function assertCanClose(groupId: string): Promise<
  | {
      ok: true;
      group: typeof groupSavingsGroups.$inferSelect;
      shareValueUsdt: number;
    }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false, message: "group_suspended" };
  }
  const cycleStatus = g.cycleStatus ?? "active";
  if (cycleStatus !== "active") {
    return { ok: false, message: "group_cycle_not_active" };
  }

  const lent = await getGroupLentUsdt(groupId);
  if (lent > 1e-12) return { ok: false, message: "group_closure_loans_outstanding" };

  const pendingLoan = await db
    .select({ id: groupAvecLoans.id })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, groupId),
        inArray(groupAvecLoans.status, ["pending", "requested"]),
      ),
    )
    .limit(1);
  if (pendingLoan.length > 0) return { ok: false, message: "group_loan_pending_exists" };

  const pendingPayout = await db
    .select({ id: groupPayoutRequests.id })
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.groupId, groupId),
        eq(groupPayoutRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (pendingPayout.length > 0) return { ok: false, message: "group_payout_pending_exists" };

  const pendingClosure = await db
    .select({ id: groupCycleClosureRequests.id })
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.groupId, groupId),
        eq(groupCycleClosureRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (pendingClosure.length > 0) {
    return { ok: false, message: "group_closure_pending_exists" };
  }

  return {
    ok: true,
    group: g,
    shareValueUsdt: numFromNumeric(g.contributionAmountUsdt?.toString()),
  };
}

async function tryExecuteClosure(args: {
  requestId: string;
  groupId: string;
  lastApproverUserId: string;
}): Promise<
  | { ok: true; executed: true }
  | { ok: true; executed: false }
  | { ok: false; message: string }
> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [req] = await tx
      .select()
      .from(groupCycleClosureRequests)
      .where(
        and(
          eq(groupCycleClosureRequests.id, args.requestId),
          eq(groupCycleClosureRequests.groupId, args.groupId),
          eq(groupCycleClosureRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (!req) return { ok: false, message: "group_closure_not_found" };

    const approvals = await tx
      .select({ approverUserId: groupCycleClosureApprovals.approverUserId })
      .from(groupCycleClosureApprovals)
      .where(eq(groupCycleClosureApprovals.requestId, args.requestId));

    if (approvals.length < req.requiredApprovals) {
      return { ok: true, executed: false };
    }

    const [g] = await tx
      .select()
      .from(groupSavingsGroups)
      .where(eq(groupSavingsGroups.id, args.groupId))
      .limit(1);
    if (!g || g.status !== "active" || g.subscriptionStatus !== "active") {
      return { ok: false, message: "group_suspended" };
    }
    if ((g.cycleStatus ?? "active") !== "active") {
      return { ok: false, message: "group_cycle_not_active" };
    }

    const snapshot = req.snapshot as unknown as ClosureSnapshot;
    const batchId = randomUUID();
    const now = new Date();

    for (const line of snapshot.members) {
      if (line.payoutUsdt <= 0) continue;
      const amtStr = fmtWalletAmount(line.payoutUsdt);
      await tx.insert(groupWalletLedgerEntries).values({
        batchId,
        groupId: args.groupId,
        entryType: "group_cycle_distribution_out",
        asset: "USDT",
        amount: `-${amtStr}`,
        meta: {
          userId: line.userId,
          requestId: req.id,
          cycleNumber: req.cycleNumber,
          ...fundBucketMeta("savings"),
        },
      });
      await creditUserAsset(tx, line.userId, "USDT", amtStr);
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: line.userId,
          entryType: "group_cycle_distribution_in",
          asset: "USDT",
          amount: amtStr,
          meta: {
            groupId: args.groupId,
            requestId: req.id,
            cycleNumber: req.cycleNumber,
          },
        },
      ]);
    }

    await tx
      .update(groupCycleClosureRequests)
      .set({
        status: "executed",
        batchId,
        executedAt: now,
        updatedAt: now,
      })
      .where(eq(groupCycleClosureRequests.id, args.requestId));

    await tx
      .update(groupSavingsGroups)
      .set({
        cycleStatus: "closed",
        cycleClosedAt: now,
        updatedAt: now,
      })
      .where(eq(groupSavingsGroups.id, args.groupId));

    const approverIds = approvals.map((a) => a.approverUserId);
    const approverRows =
      approverIds.length > 0
        ? await tx
            .select({
              id: users.id,
              email: users.email,
              displayName: users.displayName,
              avatarUrl: users.avatarUrl,
              piUsername: users.piUsername,
            })
            .from(users)
            .where(inArray(users.id, approverIds))
        : [];

    const approvers: PayoutApprover[] = approverRows.map((u) => ({
      userId: u.id,
      displayName: p2pDisplayName({
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        piUsername: u.piUsername,
      }),
    }));

    const initiatorDisplay = await userDisplayName(req.initiatedByUserId);

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      action: "cycle_closed",
      after: {
        requestId: req.id,
        cycleNumber: req.cycleNumber,
        distributableUsdt: numFromNumeric(req.distributableUsdt?.toString()),
        memberCount: snapshot.members.length,
      },
    });

    await insertGroupClosureDecisionMessage({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      meta: {
        requestId: req.id,
        cycleNumber: req.cycleNumber,
        distributableUsdt: numFromNumeric(req.distributableUsdt?.toString()),
        finalShareValueUsdt: snapshot.finalShareValueUsdt,
        totalShares: snapshot.totalShares,
        initiatedByUserId: req.initiatedByUserId,
        initiatedByDisplay: initiatorDisplay,
        approvers,
        executedAt: now.toISOString(),
      },
    });

    return { ok: true, executed: true };
  });
}

export async function proposeCycleClosure(args: {
  groupId: string;
  actorUserId: string;
}): Promise<
  | {
      ok: true;
      requestId: string;
      requiredApprovals: number;
      approvalCount: number;
      snapshot: ClosureSnapshot;
    }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin", "co_admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const check = await assertCanClose(args.groupId);
  if (!check.ok) return check;

  const g = check.group;
  const since = cycleStartedAt(g);
  const stats = await getMemberContributionStats(args.groupId, since);
  const funds = await getGroupFundSummary(args.groupId, check.shareValueUsdt);

  const displayNames = new Map<string, string>();
  for (const s of stats) {
    displayNames.set(s.userId, await userDisplayName(s.userId));
  }

  const built = buildClosureSnapshot({
    cycleNumber: g.cycleNumber ?? 1,
    shareValueUsdt: check.shareValueUsdt,
    funds,
    stats,
    displayNames,
  });
  if (!built.ok) return built;
  const snapshot = built.snapshot;

  const managers = await listGroupManagers(args.groupId);
  const requiredApprovals = payoutRequiredApprovals(managers.length);
  const db = getDb();

  const [row] = await db
    .insert(groupCycleClosureRequests)
    .values({
      groupId: args.groupId,
      initiatedByUserId: args.actorUserId,
      cycleNumber: g.cycleNumber ?? 1,
      distributableUsdt: fmtWalletAmount(snapshot.distributableUsdt),
      snapshot: snapshot as unknown as Record<string, unknown>,
      status: "pending",
      requiredApprovals,
    })
    .returning({ id: groupCycleClosureRequests.id });

  await db.insert(groupCycleClosureApprovals).values({
    requestId: row.id,
    approverUserId: args.actorUserId,
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "cycle_closure_proposed",
    after: {
      requestId: row.id,
      cycleNumber: snapshot.cycleNumber,
      distributableUsdt: snapshot.distributableUsdt,
    },
  });

  return {
    ok: true,
    requestId: row.id,
    requiredApprovals,
    approvalCount: 1,
    snapshot,
  };
}

export async function approveCycleClosure(args: {
  groupId: string;
  requestId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; executed: boolean; approvalCount: number; requiredApprovals: number }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin", "co_admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [req] = await db
    .select()
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.id, args.requestId),
        eq(groupCycleClosureRequests.groupId, args.groupId),
        eq(groupCycleClosureRequests.status, "pending"),
      ),
    )
    .limit(1);

  if (!req) return { ok: false, message: "group_closure_not_found" };

  const existing = await db
    .select({ id: groupCycleClosureApprovals.id })
    .from(groupCycleClosureApprovals)
    .where(
      and(
        eq(groupCycleClosureApprovals.requestId, args.requestId),
        eq(groupCycleClosureApprovals.approverUserId, args.actorUserId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, message: "group_closure_already_approved" };
  }

  await db.insert(groupCycleClosureApprovals).values({
    requestId: args.requestId,
    approverUserId: args.actorUserId,
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "cycle_closure_approved",
    after: { requestId: args.requestId },
  });

  const approvals = await db
    .select({ approverUserId: groupCycleClosureApprovals.approverUserId })
    .from(groupCycleClosureApprovals)
    .where(eq(groupCycleClosureApprovals.requestId, args.requestId));

  const exec = await tryExecuteClosure({
    requestId: args.requestId,
    groupId: args.groupId,
    lastApproverUserId: args.actorUserId,
  });
  if (!exec.ok) return exec;

  return {
    ok: true,
    executed: exec.executed,
    approvalCount: approvals.length,
    requiredApprovals: req.requiredApprovals,
  };
}

export async function listCycleClosureState(args: {
  groupId: string;
  userId: string;
}): Promise<{
  ok: true;
  canManage: boolean;
  cycleStatus: string;
  cycleNumber: number;
  cycleStartedAt: string;
  cycleClosedAt: string | null;
  pending: {
    id: string;
    cycleNumber: number;
    distributableUsdt: number;
    requiredApprovals: number;
    approvalCount: number;
    myApproved: boolean;
    snapshot: ClosureSnapshot;
    initiatorDisplay: string;
  } | null;
  lastExecuted: {
    id: string;
    cycleNumber: number;
    executedAt: string;
    snapshot: ClosureSnapshot;
  } | null;
}> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.userId,
  });
  const canManage = hasRole(m, ["admin", "co_admin"]);
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);

  const cycleStatus = g?.cycleStatus ?? "active";
  const cycleNumber = g?.cycleNumber ?? 1;
  const started = g ? cycleStartedAt(g).toISOString() : new Date().toISOString();

  const [pendingRow] = await db
    .select()
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.groupId, args.groupId),
        eq(groupCycleClosureRequests.status, "pending"),
      ),
    )
    .orderBy(desc(groupCycleClosureRequests.createdAt))
    .limit(1);

  let pending = null;
  if (pendingRow) {
    const approvals = await db
      .select({ approverUserId: groupCycleClosureApprovals.approverUserId })
      .from(groupCycleClosureApprovals)
      .where(eq(groupCycleClosureApprovals.requestId, pendingRow.id));
    pending = {
      id: pendingRow.id,
      cycleNumber: pendingRow.cycleNumber,
      distributableUsdt: numFromNumeric(pendingRow.distributableUsdt?.toString()),
      requiredApprovals: pendingRow.requiredApprovals,
      approvalCount: approvals.length,
      myApproved: approvals.some((a) => a.approverUserId === args.userId),
      snapshot: pendingRow.snapshot as unknown as ClosureSnapshot,
      initiatorDisplay: await userDisplayName(pendingRow.initiatedByUserId),
    };
  }

  const [lastRow] = await db
    .select()
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.groupId, args.groupId),
        eq(groupCycleClosureRequests.status, "executed"),
      ),
    )
    .orderBy(desc(groupCycleClosureRequests.executedAt))
    .limit(1);

  const lastExecuted = lastRow
    ? {
        id: lastRow.id,
        cycleNumber: lastRow.cycleNumber,
        executedAt: lastRow.executedAt!.toISOString(),
        snapshot: lastRow.snapshot as unknown as ClosureSnapshot,
      }
    : null;

  return {
    ok: true,
    canManage,
    cycleStatus,
    cycleNumber,
    cycleStartedAt: started,
    cycleClosedAt: g?.cycleClosedAt?.toISOString() ?? null,
    pending,
    lastExecuted,
  };
}

export async function previewCycleClosure(args: {
  groupId: string;
  userId: string;
}): Promise<
  | { ok: true; snapshot: ClosureSnapshot; canPropose: boolean }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.userId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const check = await assertCanClose(args.groupId);
  if (!check.ok) {
    return { ok: false, message: check.message };
  }

  const g = check.group;
  const since = cycleStartedAt(g);
  const stats = await getMemberContributionStats(args.groupId, since);
  const funds = await getGroupFundSummary(args.groupId, check.shareValueUsdt);
  const displayNames = new Map<string, string>();
  for (const s of stats) {
    displayNames.set(s.userId, await userDisplayName(s.userId));
  }

  const built = buildClosureSnapshot({
    cycleNumber: g.cycleNumber ?? 1,
    shareValueUsdt: check.shareValueUsdt,
    funds,
    stats,
    displayNames,
  });
  if (!built.ok) return built;

  const canManage = hasRole(m, ["admin", "co_admin"]);
  const db = getDb();
  const pending = await db
    .select({ id: groupCycleClosureRequests.id })
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.groupId, args.groupId),
        eq(groupCycleClosureRequests.status, "pending"),
      ),
    )
    .limit(1);

  return {
    ok: true,
    snapshot: built.snapshot,
    canPropose: canManage && pending.length === 0,
  };
}

export async function startNextAvecCycle(args: {
  groupId: string;
  actorUserId: string;
}): Promise<{ ok: true; cycleNumber: number } | { ok: false; message: string }> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  if ((g.cycleStatus ?? "active") !== "closed") {
    return { ok: false, message: "group_cycle_not_closed" };
  }

  const next = (g.cycleNumber ?? 1) + 1;
  const now = new Date();
  await db
    .update(groupSavingsGroups)
    .set({
      cycleStatus: "active",
      cycleNumber: next,
      cycleStartedAt: now,
      cycleClosedAt: null,
      updatedAt: now,
    })
    .where(eq(groupSavingsGroups.id, args.groupId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "cycle_started",
    after: { cycleNumber: next },
  });

  return { ok: true, cycleNumber: next };
}

export async function getLastClosureReport(args: {
  groupId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      groupName: string;
      cycleNumber: number;
      executedAt: string;
      snapshot: ClosureSnapshot;
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.userId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [g] = await db
    .select({ name: groupSavingsGroups.name })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };

  const [row] = await db
    .select()
    .from(groupCycleClosureRequests)
    .where(
      and(
        eq(groupCycleClosureRequests.groupId, args.groupId),
        eq(groupCycleClosureRequests.status, "executed"),
      ),
    )
    .orderBy(desc(groupCycleClosureRequests.executedAt))
    .limit(1);

  if (!row?.executedAt) return { ok: false, message: "group_closure_report_none" };

  return {
    ok: true,
    groupName: g.name,
    cycleNumber: row.cycleNumber,
    executedAt: row.executedAt.toISOString(),
    snapshot: row.snapshot as unknown as ClosureSnapshot,
  };
}
