import { and, desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import { getGroupUsdtBalance } from "@/lib/group-savings-ledger";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import {
  GROUP_SUBSCRIPTION_FEE_USDT,
  type GroupSavingsType,
} from "@/lib/group-savings-types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { debitUserAsset, creditUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export async function createGroup(args: {
  userId: string;
  type: GroupSavingsType;
  name: string;
  countryCode?: string | null;
  minMembers: number;
  maxMembers: number;
  contributionAmountUsdt: number;
  cycleDurationDays: number;
  paymentRules?: string | null;
}): Promise<{ ok: true; groupId: string } | { ok: false; message: string }> {
  const db = getDb();
  if (!(args.type === "likelimba" || args.type === "avec")) {
    return { ok: false, message: "group_invalid_type" };
  }
  if (!args.name || args.name.trim().length < 2) {
    return { ok: false, message: "group_invalid_name" };
  }
  if (!Number.isFinite(args.minMembers) || args.minMembers < 2) {
    return { ok: false, message: "group_invalid_members" };
  }
  if (
    !Number.isFinite(args.maxMembers) ||
    args.maxMembers < args.minMembers ||
    args.maxMembers > 100
  ) {
    return { ok: false, message: "group_invalid_members" };
  }
  if (
    !Number.isFinite(args.contributionAmountUsdt) ||
    args.contributionAmountUsdt <= 0
  ) {
    return { ok: false, message: "group_invalid_contribution" };
  }
  if (!Number.isFinite(args.cycleDurationDays) || args.cycleDurationDays < 1) {
    return { ok: false, message: "group_invalid_cycle" };
  }

  const id = await db.transaction(async (tx) => {
    const [g] = await tx
      .insert(groupSavingsGroups)
      .values({
        type: args.type,
        name: args.name.trim(),
        countryCode: args.countryCode?.trim() || null,
        minMembers: Math.floor(args.minMembers),
        maxMembers: Math.floor(args.maxMembers),
        contributionAmountUsdt: fmtWalletAmount(args.contributionAmountUsdt),
        cycleDurationDays: Math.floor(args.cycleDurationDays),
        paymentRules: args.paymentRules ?? null,
        status: "pending",
        subscriptionStatus: "overdue",
        createdByUserId: args.userId,
      })
      .returning({ id: groupSavingsGroups.id });

    if (!g?.id) throw new Error("insert");

    await tx.insert(groupSavingsMemberships).values({
      groupId: g.id,
      userId: args.userId,
      role: "admin",
      status: "approved",
      approvedByUserId: args.userId,
    });

    await writeGroupAudit({
      groupId: g.id,
      actorUserId: args.userId,
      action: "group_created",
      before: null,
      after: {
        type: args.type,
        name: args.name.trim(),
        subscriptionFeeUsdt: GROUP_SUBSCRIPTION_FEE_USDT,
      },
    });

    return g.id;
  });

  return { ok: true, groupId: id };
}

export async function listMyGroups(args: { userId: string }) {
  const db = getDb();
  const rows = await db
    .select({
      groupId: groupSavingsGroups.id,
      name: groupSavingsGroups.name,
      type: groupSavingsGroups.type,
      status: groupSavingsGroups.status,
      subscriptionStatus: groupSavingsGroups.subscriptionStatus,
      nextBillingAt: groupSavingsGroups.nextBillingAt,
      role: groupSavingsMemberships.role,
      membershipStatus: groupSavingsMemberships.status,
      createdAt: groupSavingsGroups.createdAt,
    })
    .from(groupSavingsMemberships)
    .innerJoin(
      groupSavingsGroups,
      eq(groupSavingsMemberships.groupId, groupSavingsGroups.id),
    )
    .where(eq(groupSavingsMemberships.userId, args.userId))
    .orderBy(desc(groupSavingsGroups.createdAt))
    .limit(50);

  return {
    groups: rows.map((r) => ({
      ...r,
      nextBillingAt: r.nextBillingAt ? r.nextBillingAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

export async function getGroupDashboard(args: { groupId: string; userId: string }) {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };

  // Member can view even if subscription overdue, but actions are gated elsewhere.
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || (m.status !== "approved" && m.status !== "pending")) {
    return { ok: false as const, message: "group_forbidden" };
  }

  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });

  const balance = await getGroupUsdtBalance(args.groupId);
  const members = await db
    .select({
      userId: groupSavingsMemberships.userId,
      role: groupSavingsMemberships.role,
      status: groupSavingsMemberships.status,
      email: users.email,
    })
    .from(groupSavingsMemberships)
    .innerJoin(users, eq(groupSavingsMemberships.userId, users.id))
    .where(eq(groupSavingsMemberships.groupId, args.groupId))
    .orderBy(desc(groupSavingsMemberships.createdAt))
    .limit(200);

  return {
    ok: true as const,
    group: {
      id: g.id,
      type: g.type,
      name: g.name,
      countryCode: g.countryCode,
      minMembers: g.minMembers,
      maxMembers: g.maxMembers,
      contributionAmountUsdt: g.contributionAmountUsdt?.toString() ?? "0",
      cycleDurationDays: g.cycleDurationDays,
      paymentRules: g.paymentRules,
      status: g.status,
      subscriptionStatus: g.subscriptionStatus,
      nextBillingAt: g.nextBillingAt ? g.nextBillingAt.toISOString() : null,
      balanceUsdt: balance,
      createdAt: g.createdAt.toISOString(),
      me: { role: m.role, status: m.status },
    },
    members,
  };
}

export async function requestJoinGroup(args: { groupId: string; userId: string }) {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };
  if (g.status === "suspended") return { ok: false as const, message: "group_suspended" };
  if (g.status !== "active" && g.status !== "approved" && g.status !== "pending") {
    return { ok: false as const, message: "group_closed" };
  }

  const existing = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (existing) return { ok: true as const };

  await db.insert(groupSavingsMemberships).values({
    groupId: args.groupId,
    userId: args.userId,
    role: "member",
    status: "pending",
  });
  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.userId,
    action: "member_requested_join",
  });
  return { ok: true as const };
}

export async function reviewMember(args: {
  groupId: string;
  actorUserId: string;
  targetUserId: string;
  accept: boolean;
}) {
  const db = getDb();
  const g = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1)
    .then((x) => x[0] ?? null);
  if (!g) return { ok: false as const, message: "group_not_found" };
  if (g.status === "suspended") return { ok: false as const, message: "group_suspended" };

  const actor = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.actorUserId });
  if (!hasRole(actor, ["admin", "co_admin"])) return { ok: false as const, message: "group_forbidden" };

  const [m] = await db
    .select()
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.targetUserId),
      ),
    )
    .limit(1);
  if (!m || m.status !== "pending") return { ok: false as const, message: "member_not_pending" };

  const next = args.accept ? "approved" : "rejected";
  await db
    .update(groupSavingsMemberships)
    .set({
      status: next,
      approvedByUserId: args.actorUserId,
      updatedAt: new Date(),
    })
    .where(eq(groupSavingsMemberships.id, m.id));
  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: args.accept ? "member_approved" : "member_rejected",
    before: { userId: args.targetUserId, status: m.status },
    after: { userId: args.targetUserId, status: next },
  });
  return { ok: true as const };
}

export async function setCoAdmins(args: {
  groupId: string;
  actorUserId: string;
  coAdminUserIds: string[];
}) {
  const db = getDb();
  const actor = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.actorUserId });
  if (!hasRole(actor, ["admin"])) return { ok: false as const, message: "group_forbidden" };

  const ids = Array.from(new Set(args.coAdminUserIds)).slice(0, 3);

  // Ensure targets are approved members.
  const members = await db
    .select()
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        inArray(groupSavingsMemberships.userId, ids),
      ),
    );
  if (members.some((m) => m.status !== "approved")) {
    return { ok: false as const, message: "group_invalid_coadmins" };
  }

  await db.transaction(async (tx) => {
    // Reset all co_admin back to member first (admin stays admin).
    await tx
      .update(groupSavingsMemberships)
      .set({ role: "member", updatedAt: new Date() })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.role, "co_admin"),
        ),
      );

    // Promote selected to co_admin (but not the admin themself).
    for (const uid of ids) {
      const row = members.find((m) => m.userId === uid);
      if (!row) continue;
      if (row.role === "admin") continue;
      await tx
        .update(groupSavingsMemberships)
        .set({ role: "co_admin", updatedAt: new Date() })
        .where(eq(groupSavingsMemberships.id, row.id));
    }
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "co_admins_updated",
    after: { coAdmins: ids },
  });
  return { ok: true as const };
}

export async function contributeToGroup(args: {
  groupId: string;
  userId: string;
  amountUsdt: number;
}) {
  const db = getDb();
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") return { ok: false as const, message: "group_forbidden" };
  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false as const, message: "group_invalid_amount" };
  }

  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };
  if (g.status === "suspended") return { ok: false as const, message: "group_suspended" };
  if (g.status !== "active" && g.status !== "approved") return { ok: false as const, message: "group_closed" };

  const amt = args.amountUsdt;
  const amtStr = fmtWalletAmount(amt);
  const batchId = randomUUID();

  try {
    await db.transaction(async (tx) => {
      const [u] = await tx
        .select({ bal: users.balance })
        .from(users)
        .where(eq(users.id, args.userId))
        .limit(1);
      const bal = numFromNumeric(u?.bal?.toString());
      if (bal + 1e-18 < amt) throw new Error("insufficient");

      await debitUserAsset(tx, args.userId, "USDT", amtStr);
      await tx.insert(groupWalletLedgerEntries).values({
        batchId,
        groupId: args.groupId,
        entryType: "group_contribution_in",
        asset: "USDT",
        amount: amtStr,
        meta: { userId: args.userId },
      });
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.userId,
          entryType: "group_contribution_out",
          asset: "USDT",
          amount: `-${amtStr}`,
          meta: { groupId: args.groupId },
        },
      ]);
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") return { ok: false as const, message: "trade_insufficient_usdt" };
    return { ok: false as const, message: "group_contribution_failed" };
  }

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.userId,
    action: "contribution_made",
    after: { amountUsdt: amt },
  });

  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });
  return { ok: true as const };
}

export async function payoutFromGroup(args: {
  groupId: string;
  actorUserId: string;
  toUserId: string;
  amountUsdt: number;
}) {
  const db = getDb();
  const actor = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.actorUserId });
  if (!hasRole(actor, ["admin", "co_admin"])) return { ok: false as const, message: "group_forbidden" };

  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false as const, message: "group_invalid_amount" };
  }

  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, args.groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false as const, message: "group_suspended" };
  }

  const bal = await getGroupUsdtBalance(args.groupId);
  if (bal + 1e-18 < args.amountUsdt) {
    return { ok: false as const, message: "group_insufficient_balance" };
  }

  const amtStr = fmtWalletAmount(args.amountUsdt);
  const batchId = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(groupWalletLedgerEntries).values({
      batchId,
      groupId: args.groupId,
      entryType: "group_payout_out",
      asset: "USDT",
      amount: `-${amtStr}`,
      meta: { toUserId: args.toUserId, by: args.actorUserId },
    });
    await creditUserAsset(tx, args.toUserId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: args.toUserId,
        entryType: "group_payout_in",
        asset: "USDT",
        amount: amtStr,
        meta: { groupId: args.groupId },
      },
    ]);
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "payout_sent",
    after: { toUserId: args.toUserId, amountUsdt: args.amountUsdt },
  });

  return { ok: true as const };
}

export async function listGroupLedger(args: { groupId: string; userId: string; limit?: number }) {
  const db = getDb();
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") return { ok: false as const, message: "group_forbidden" };
  await ensureGroupSubscriptionUpToDate({ groupId: args.groupId });

  const limit = Math.min(Math.max(1, args.limit ?? 50), 100);
  const rows = await db
    .select({
      id: groupWalletLedgerEntries.id,
      batchId: groupWalletLedgerEntries.batchId,
      entryType: groupWalletLedgerEntries.entryType,
      asset: groupWalletLedgerEntries.asset,
      amount: groupWalletLedgerEntries.amount,
      meta: groupWalletLedgerEntries.meta,
      createdAt: groupWalletLedgerEntries.createdAt,
    })
    .from(groupWalletLedgerEntries)
    .where(eq(groupWalletLedgerEntries.groupId, args.groupId))
    .orderBy(desc(groupWalletLedgerEntries.createdAt))
    .limit(limit);

  return {
    ok: true as const,
    entries: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
}

