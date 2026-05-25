import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupPayoutApprovals,
  groupPayoutRequests,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import { getGroupFundSummary } from "@/lib/avec/fund-buckets";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import {
  insertGroupPayoutDecisionMessage,
  insertGroupPayoutPendingMessage,
} from "@/lib/group-savings-messaging";
import { notifyGroupMembers } from "@/lib/group-savings-notifications";
import { createUserNotification } from "@/lib/notifications-service";
import { p2pDisplayName } from "@/lib/p2p-display";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { debitUserAsset, creditUserAsset } from "@/lib/wallet-move-assets";
import { fundBucketMeta } from "@/lib/avec/fund-buckets";
import { fmtWalletAmount } from "@/lib/wallet-types";

export type PayoutApprover = { userId: string; displayName: string };

/** Managers = approved admin + co_admin (max 4). Majority rule: ceil(2/3). */
export function payoutRequiredApprovals(managerCount: number): number {
  if (managerCount <= 0) return 1;
  return Math.max(1, Math.ceil((managerCount * 2) / 3));
}

export async function listGroupManagers(groupId: string): Promise<
  { userId: string; role: string }[]
> {
  const db = getDb();
  const rows = await db
    .select({
      userId: groupSavingsMemberships.userId,
      role: groupSavingsMemberships.role,
    })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, groupId),
        eq(groupSavingsMemberships.status, "approved"),
        inArray(groupSavingsMemberships.role, ["admin", "co_admin"]),
      ),
    );
  return rows;
}

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

async function tryExecuteRequest(args: {
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
      .from(groupPayoutRequests)
      .where(
        and(
          eq(groupPayoutRequests.id, args.requestId),
          eq(groupPayoutRequests.groupId, args.groupId),
          eq(groupPayoutRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (!req) return { ok: false, message: "group_payout_not_found" };

    const approvals = await tx
      .select({ approverUserId: groupPayoutApprovals.approverUserId })
      .from(groupPayoutApprovals)
      .where(eq(groupPayoutApprovals.requestId, args.requestId));

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

    const amountUsdt = Number(req.amountUsdt);
    const funds = await getGroupFundSummary(args.groupId);
    if (funds.availableUsdt + 1e-18 < amountUsdt) {
      return { ok: false, message: "group_insufficient_balance" };
    }

    const batchId = randomUUID();
    const amtStr = fmtWalletAmount(amountUsdt);

    await tx.insert(groupWalletLedgerEntries).values({
      batchId,
      groupId: args.groupId,
      entryType: "group_payout_out",
      asset: "USDT",
      amount: `-${amtStr}`,
      meta: { toUserId: req.toUserId, requestId: req.id, ...fundBucketMeta("savings") },
    });
    await creditUserAsset(tx, req.toUserId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: req.toUserId,
        entryType: "group_payout_in",
        asset: "USDT",
        amount: amtStr,
        meta: { groupId: args.groupId, requestId: req.id },
      },
    ]);

    const now = new Date();
    await tx
      .update(groupPayoutRequests)
      .set({
        status: "executed",
        batchId,
        executedAt: now,
        updatedAt: now,
      })
      .where(eq(groupPayoutRequests.id, args.requestId));

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

    const beneficiaryDisplay = await userDisplayName(req.toUserId);
    const initiatorDisplay = await userDisplayName(req.initiatedByUserId);

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      action: "payout_sent",
      after: {
        requestId: req.id,
        toUserId: req.toUserId,
        amountUsdt,
        approverIds,
      },
    });

    await insertGroupPayoutDecisionMessage({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      meta: {
        requestId: req.id,
        amountUsdt,
        beneficiaryUserId: req.toUserId,
        beneficiaryDisplay,
        initiatedByUserId: req.initiatedByUserId,
        initiatedByDisplay: initiatorDisplay,
        approvers,
        executedAt: now.toISOString(),
      },
    });

    await createUserNotification({
      userId: req.toUserId,
      kind: "group_payout",
      payload: {
        groupId: args.groupId,
        amount: amountUsdt.toFixed(2),
        asset: "USDT",
      },
    });
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_payout",
      excludeUserId: req.toUserId,
      payload: {
        groupId: args.groupId,
        amount: amountUsdt.toFixed(2),
        asset: "USDT",
      },
    });

    return { ok: true, executed: true };
  });
}

export async function proposeGroupPayout(args: {
  groupId: string;
  actorUserId: string;
  toUserId: string;
  amountUsdt: number;
}): Promise<
  | {
      ok: true;
      requestId: string;
      requiredApprovals: number;
      approvalCount: number;
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

  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false, message: "group_suspended" };
  }
  if ((g.cycleStatus ?? "active") !== "active") {
    return { ok: false, message: "group_cycle_not_active" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const [beneficiary] = await db
    .select({ status: groupSavingsMemberships.status })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.toUserId),
      ),
    )
    .limit(1);
  if (!beneficiary || beneficiary.status !== "approved") {
    return { ok: false, message: "member_not_found" };
  }

  const pending = await db
    .select({ id: groupPayoutRequests.id })
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.groupId, args.groupId),
        eq(groupPayoutRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (pending.length > 0) {
    return { ok: false, message: "group_payout_pending_exists" };
  }

  const managers = await listGroupManagers(args.groupId);
  const required = payoutRequiredApprovals(managers.length);

  const [row] = await db
    .insert(groupPayoutRequests)
    .values({
      groupId: args.groupId,
      initiatedByUserId: args.actorUserId,
      toUserId: args.toUserId,
      amountUsdt: fmtWalletAmount(args.amountUsdt),
      status: "pending",
      requiredApprovals: required,
    })
    .returning({ id: groupPayoutRequests.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  const beneficiaryDisplay = await userDisplayName(args.toUserId);
  const initiatorDisplay = await userDisplayName(args.actorUserId);

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "payout_proposed",
    after: {
      requestId: row.id,
      toUserId: args.toUserId,
      amountUsdt: args.amountUsdt,
      requiredApprovals: required,
    },
  });

  try {
    await insertGroupPayoutPendingMessage({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      meta: {
        requestId: row.id,
        amountUsdt: args.amountUsdt,
        beneficiaryUserId: args.toUserId,
        beneficiaryDisplay,
        initiatedByUserId: args.actorUserId,
        initiatedByDisplay: initiatorDisplay,
        requiredApprovals: required,
        approvalCount: 0,
      },
    });
  } catch {
    // messages table optional
  }

  return {
    ok: true,
    requestId: row.id,
    requiredApprovals: required,
    approvalCount: 0,
  };
}

export async function approveGroupPayout(args: {
  groupId: string;
  requestId: string;
  actorUserId: string;
}): Promise<
  | {
      ok: true;
      executed: boolean;
      approvalCount: number;
      requiredApprovals: number;
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

  const db = getDb();
  const [req] = await db
    .select()
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.id, args.requestId),
        eq(groupPayoutRequests.groupId, args.groupId),
        eq(groupPayoutRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (!req) return { ok: false, message: "group_payout_not_found" };

  if (args.actorUserId === req.initiatedByUserId) {
    return { ok: false, message: "group_gov_initiator_cannot_vote" };
  }

  const existing = await db
    .select({ id: groupPayoutApprovals.id })
    .from(groupPayoutApprovals)
    .where(
      and(
        eq(groupPayoutApprovals.requestId, args.requestId),
        eq(groupPayoutApprovals.approverUserId, args.actorUserId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { ok: false, message: "group_payout_already_approved" };
  }

  await db.insert(groupPayoutApprovals).values({
    requestId: args.requestId,
    approverUserId: args.actorUserId,
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "payout_approved",
    after: { requestId: args.requestId },
  });

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupPayoutApprovals)
    .where(eq(groupPayoutApprovals.requestId, args.requestId));
  const approvalCount = countRows[0]?.n ?? 0;

  const exec = await tryExecuteRequest({
    requestId: args.requestId,
    groupId: args.groupId,
    lastApproverUserId: args.actorUserId,
  });
  if (!exec.ok) return exec;

  return {
    ok: true,
    executed: exec.executed,
    approvalCount,
    requiredApprovals: req.requiredApprovals,
  };
}

export async function rejectGroupPayout(args: {
  groupId: string;
  requestId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!hasRole(actor, ["admin", "co_admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const reason = args.reason?.trim() ?? "";
  if (reason.length < 3) {
    return { ok: false, message: "group_reject_reason_required" };
  }

  const db = getDb();
  const [req] = await db
    .select()
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.id, args.requestId),
        eq(groupPayoutRequests.groupId, args.groupId),
        eq(groupPayoutRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (!req) return { ok: false, message: "group_payout_not_found" };

  const now = new Date();
  await db
    .update(groupPayoutRequests)
    .set({
      status: "rejected",
      rejectionReason: reason.slice(0, 500),
      updatedAt: now,
    })
    .where(eq(groupPayoutRequests.id, args.requestId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "payout_rejected",
    after: { requestId: args.requestId, reason },
  });

  const beneficiaryDisplay = await userDisplayName(req.toUserId);
  const preview = `PAYOUT_REJECTED|${Number(req.amountUsdt).toFixed(2)}|${beneficiaryDisplay}|${reason}`;
  try {
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      payload: {
        groupId: args.groupId,
        messageId: req.id,
        preview,
        senderEmail: "",
        messageType: "system",
      },
    });
    await createUserNotification({
      userId: req.toUserId,
      kind: "group_message",
      payload: { groupId: args.groupId, preview, messageType: "system" },
    });
  } catch {
    // optional
  }

  return { ok: true };
}

export async function listPendingGroupPayouts(args: {
  groupId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      pending: {
        id: string;
        toUserId: string;
        beneficiaryDisplay: string;
        initiatorDisplay: string;
        amountUsdt: number;
        requiredApprovals: number;
        approvalCount: number;
        approvers: PayoutApprover[];
        myApproved: boolean;
        createdAt: string;
      }[];
      managerCount: number;
      canManage: boolean;
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const canManage = hasRole(m, ["admin", "co_admin"]);
  const db = getDb();
  const managers = await listGroupManagers(args.groupId);

  const rows = await db
    .select()
    .from(groupPayoutRequests)
    .where(
      and(
        eq(groupPayoutRequests.groupId, args.groupId),
        eq(groupPayoutRequests.status, "pending"),
      ),
    )
    .orderBy(desc(groupPayoutRequests.createdAt))
    .limit(5);

  const pending = await Promise.all(
    rows.map(async (r) => {
      const approvalRows = await db
        .select({ approverUserId: groupPayoutApprovals.approverUserId })
        .from(groupPayoutApprovals)
        .where(eq(groupPayoutApprovals.requestId, r.id));

      const approverIds = approvalRows.map((a) => a.approverUserId);
      const approverUsers =
        approverIds.length > 0
          ? await db
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

      return {
        id: r.id,
        toUserId: r.toUserId,
        beneficiaryDisplay: await userDisplayName(r.toUserId),
        initiatorDisplay: await userDisplayName(r.initiatedByUserId),
        amountUsdt: Number(r.amountUsdt),
        requiredApprovals: r.requiredApprovals,
        approvalCount: approverIds.length,
        approvers: approverUsers.map((u) => ({
          userId: u.id,
          displayName: p2pDisplayName({
            email: u.email,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            piUsername: u.piUsername,
          }),
        })),
        myApproved: approverIds.includes(args.userId),
        createdAt: r.createdAt.toISOString(),
      };
    }),
  );

  return {
    ok: true,
    pending,
    managerCount: managers.length,
    canManage,
  };
}

/** @deprecated Use proposeGroupPayout + approveGroupPayout */
export async function payoutFromGroup(args: {
  groupId: string;
  actorUserId: string;
  toUserId: string;
  amountUsdt: number;
}) {
  return proposeGroupPayout(args);
}

/** Execute a treasury payout after collective governance approval (no manager quorum). */
export async function executeGovernancePayout(args: {
  groupId: string;
  toUserId: string;
  amountUsdt: number;
  initiatedByUserId: string;
  actorUserId: string;
  proposalId: string;
}): Promise<{ ok: true; requestId: string } | { ok: false; message: string }> {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false, message: "group_suspended" };
  }
  if ((g.cycleStatus ?? "active") !== "active") {
    return { ok: false, message: "group_cycle_not_active" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const amtStr = fmtWalletAmount(args.amountUsdt);
  const batchId = randomUUID();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(groupPayoutRequests)
      .values({
        groupId: args.groupId,
        initiatedByUserId: args.initiatedByUserId,
        toUserId: args.toUserId,
        amountUsdt: amtStr,
        status: "executed",
        requiredApprovals: 0,
        batchId,
        proposalId: args.proposalId,
        executedAt: new Date(),
      })
      .returning({ id: groupPayoutRequests.id });

    if (!row?.id) return { ok: false as const, message: "group_action_failed" };

    await tx.insert(groupWalletLedgerEntries).values({
      batchId,
      groupId: args.groupId,
      entryType: "group_payout_out",
      asset: "USDT",
      amount: `-${amtStr}`,
      meta: {
        toUserId: args.toUserId,
        requestId: row.id,
        proposalId: args.proposalId,
        ...fundBucketMeta("savings"),
      },
    });
    await creditUserAsset(tx, args.toUserId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: args.toUserId,
        entryType: "group_payout_in",
        asset: "USDT",
        amount: amtStr,
        meta: {
          groupId: args.groupId,
          requestId: row.id,
          proposalId: args.proposalId,
        },
      },
    ]);

    const beneficiaryDisplay = await userDisplayName(args.toUserId);
    const initiatorDisplay = await userDisplayName(args.initiatedByUserId);
    const now = new Date();

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      action: "gov_payout_executed",
      after: {
        requestId: row.id,
        proposalId: args.proposalId,
        toUserId: args.toUserId,
        amountUsdt: args.amountUsdt,
      },
    });

    try {
      await insertGroupPayoutDecisionMessage({
        groupId: args.groupId,
        actorUserId: args.actorUserId,
        meta: {
          requestId: row.id,
          amountUsdt: args.amountUsdt,
          beneficiaryUserId: args.toUserId,
          beneficiaryDisplay,
          initiatedByUserId: args.initiatedByUserId,
          initiatedByDisplay: initiatorDisplay,
          approvers: [{ userId: "governance", displayName: "Collective vote" }],
          executedAt: now.toISOString(),
        },
      });
    } catch {
      // optional
    }

    await createUserNotification({
      userId: args.toUserId,
      kind: "group_payout",
      payload: {
        groupId: args.groupId,
        amount: args.amountUsdt.toFixed(2),
        asset: "USDT",
      },
    });
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_payout",
      excludeUserId: args.toUserId,
      payload: {
        groupId: args.groupId,
        amount: args.amountUsdt.toFixed(2),
        asset: "USDT",
      },
    });

    return { ok: true as const, requestId: row.id };
  });
}
