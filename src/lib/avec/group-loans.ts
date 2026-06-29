import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  groupAvecLoanApprovals,
  groupAvecLoans,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupWalletLedgerEntries,
  users,
} from "@/db";
import {
  classifyLoanTier,
  getGroupLoanInterestPct,
  getGroupLoanPenaltyPct,
} from "@/lib/avec/governance/rules";
import {
  createLoanCriticalProposal,
  createLoanMediumProposal,
} from "@/lib/avec/governance/proposal-engine";
import {
  allocateLoanRepayment,
  AVEC_LOAN_MAX_DAYS,
  AVEC_LOAN_PENALTY_PCT,
  computeLoanCharges,
} from "@/lib/avec/loan-terms";
import {
  buildLoanRepayGroupLedgerLines,
  getGroupFundSummary,
  fundBucketMeta,
} from "@/lib/avec/fund-buckets";
import { getMemberContributionStats } from "@/lib/group-savings-member-stats";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import {
  canManageGroupLoans,
  canProposeGroupLoan,
  getGroupOrNull,
  hasRole,
  getMyMembershipOrNull,
} from "@/lib/group-savings-permissions";
import { insertGroupLoanDecisionMessage } from "@/lib/group-savings-messaging";
import {
  listGroupManagers,
  payoutRequiredApprovals,
} from "@/lib/group-savings-payouts";
import { p2pDisplayName } from "@/lib/p2p-display";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

export const AVEC_MAX_LOAN_SAVINGS_MULTIPLIER = 3;

export { getGroupLentUsdt } from "@/lib/avec/fund-buckets";

async function memberSavedUsdt(groupId: string, userId: string): Promise<number> {
  const stats = await getMemberContributionStats(groupId);
  const row = stats.find((s) => s.userId === userId);
  return row?.totalUsdt ?? 0;
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

async function assertGroupActive(groupId: string) {
  const db = getDb();
  const [g] = await db
    .select()
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g) return { ok: false as const, message: "group_not_found" };
  await ensureGroupSubscriptionUpToDate({ groupId });
  if (g.status !== "active" || g.subscriptionStatus !== "active") {
    return { ok: false as const, message: "group_suspended" };
  }
  if ((g.cycleStatus ?? "active") !== "active") {
    return { ok: false as const, message: "group_cycle_not_active" };
  }
  return { ok: true as const, group: g };
}

async function tryDisburseLoan(args: {
  loanId: string;
  groupId: string;
  lastApproverUserId: string;
}): Promise<
  | { ok: true; executed: true }
  | { ok: true; executed: false }
  | { ok: false; message: string }
> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [loan] = await tx
      .select()
      .from(groupAvecLoans)
      .where(
        and(
          eq(groupAvecLoans.id, args.loanId),
          eq(groupAvecLoans.groupId, args.groupId),
          eq(groupAvecLoans.status, "pending"),
        ),
      )
      .limit(1);
    if (!loan) return { ok: false, message: "group_loan_not_found" };

    const approvals = await tx
      .select({ approverUserId: groupAvecLoanApprovals.approverUserId })
      .from(groupAvecLoanApprovals)
      .where(eq(groupAvecLoanApprovals.loanId, args.loanId));

    if (approvals.length < loan.requiredApprovals) {
      return { ok: true, executed: false };
    }

    const amountUsdt = Number(loan.principalUsdt);
    const funds = await getGroupFundSummary(args.groupId);
    if (funds.availableUsdt + 1e-18 < amountUsdt) {
      return { ok: false, message: "group_insufficient_balance" };
    }

    const { assertWithinDailyTreasuryOutflowCap } = await import(
      "@/lib/avec/treasury-daily-limits"
    );
    const dailyCap = await assertWithinDailyTreasuryOutflowCap({
      groupId: args.groupId,
      additionalUsdt: amountUsdt,
    });
    if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

    const batchId = randomUUID();
    const amtStr = fmtWalletAmount(amountUsdt);

    await tx.insert(groupWalletLedgerEntries).values({
      batchId,
      groupId: args.groupId,
      entryType: "group_loan_disburse_out",
      asset: "USDT",
      amount: `-${amtStr}`,
      meta: {
        loanId: loan.id,
        borrowerUserId: loan.borrowerUserId,
        ...fundBucketMeta("savings"),
      },
    });
    await creditUserAsset(tx, loan.borrowerUserId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: loan.borrowerUserId,
        entryType: "group_loan_disburse_in",
        asset: "USDT",
        amount: amtStr,
        meta: { groupId: args.groupId, loanId: loan.id },
      },
    ]);

    const now = new Date();
    await tx
      .update(groupAvecLoans)
      .set({
        status: "disbursed",
        outstandingUsdt: amtStr,
        batchId,
        disbursedAt: now,
        updatedAt: now,
      })
      .where(eq(groupAvecLoans.id, args.loanId));

    const approverIds = approvals.map((a) => a.approverUserId);
    const approverUsers =
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

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      action: "loan_disbursed",
      after: {
        loanId: loan.id,
        borrowerUserId: loan.borrowerUserId,
        amountUsdt,
      },
    });

    await insertGroupLoanDecisionMessage({
      groupId: args.groupId,
      actorUserId: args.lastApproverUserId,
      meta: {
        loanId: loan.id,
        amountUsdt,
        borrowerUserId: loan.borrowerUserId,
        borrowerDisplay: await userDisplayName(loan.borrowerUserId),
        initiatedByUserId: loan.initiatedByUserId,
        initiatedByDisplay: await userDisplayName(loan.initiatedByUserId),
        approvers: approverUsers.map((u) => ({
          userId: u.id,
          displayName: p2pDisplayName({
            email: u.email,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            piUsername: u.piUsername,
          }),
        })),
        executedAt: now.toISOString(),
        kind: "disbursed",
      },
    });

    return { ok: true, executed: true };
  });
}

export async function proposeGroupLoan(args: {
  groupId: string;
  actorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; loanId: string; requiredApprovals: number }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!canProposeGroupLoan(actor)) {
    return { ok: false, message: "group_forbidden" };
  }
  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const gCheck = await assertGroupActive(args.groupId);
  if (!gCheck.ok) return gCheck;

  const saved = await memberSavedUsdt(args.groupId, args.borrowerUserId);
  const maxLoan = saved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER;
  if (args.amountUsdt > maxLoan + 1e-18) {
    return { ok: false, message: "group_loan_exceeds_limit" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const db = getDb();
  const [borrower] = await db
    .select({ status: groupSavingsMemberships.status })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, args.groupId),
        eq(groupSavingsMemberships.userId, args.borrowerUserId),
      ),
    )
    .limit(1);
  if (!borrower || borrower.status !== "approved") {
    return { ok: false, message: "member_not_found" };
  }

  const pending = await db
    .select({ id: groupAvecLoans.id })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        inArray(groupAvecLoans.status, ["pending", "requested"]),
      ),
    )
    .limit(1);
  if (pending.length > 0) {
    return { ok: false, message: "group_loan_pending_exists" };
  }

  const managers = await listGroupManagers(args.groupId);
  const required = payoutRequiredApprovals(managers.length);
  const amtStr = fmtWalletAmount(args.amountUsdt);
  const interestPct = getGroupLoanInterestPct(gCheck.group.paymentRules);
  const penaltyPct = getGroupLoanPenaltyPct(gCheck.group.paymentRules);

  const [row] = await db
    .insert(groupAvecLoans)
    .values({
      groupId: args.groupId,
      borrowerUserId: args.borrowerUserId,
      initiatedByUserId: args.actorUserId,
      principalUsdt: amtStr,
      outstandingUsdt: amtStr,
      status: "pending",
      requiredApprovals: required,
      interestRatePctMonth: String(interestPct),
      penaltyRatePct: String(penaltyPct),
      loanTermDays: AVEC_LOAN_MAX_DAYS,
    })
    .returning({ id: groupAvecLoans.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_proposed",
    after: {
      loanId: row.id,
      borrowerUserId: args.borrowerUserId,
      amountUsdt: args.amountUsdt,
      maxAllowed: maxLoan,
    },
  });

  return { ok: true, loanId: row.id, requiredApprovals: required };
}

/** Disburse a loan after collective vote (requiredApprovals = 0). */
export async function executeLoanFromGovernance(args: {
  groupId: string;
  actorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
  proposalId?: string;
}): Promise<{ ok: true; executed: boolean } | { ok: false; message: string }> {
  const gCheck = await assertGroupActive(args.groupId);
  if (!gCheck.ok) return gCheck;

  const saved = await memberSavedUsdt(args.groupId, args.borrowerUserId);
  const maxLoan = saved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER;
  if (args.amountUsdt > maxLoan + 1e-18) {
    return { ok: false, message: "group_loan_exceeds_limit" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const { assertWithinDailyTreasuryOutflowCap } = await import(
    "@/lib/avec/treasury-daily-limits"
  );
  const dailyCap = await assertWithinDailyTreasuryOutflowCap({
    groupId: args.groupId,
    additionalUsdt: args.amountUsdt,
  });
  if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

  const db = getDb();
  const interestPct = getGroupLoanInterestPct(gCheck.group.paymentRules);
  const penaltyPct = getGroupLoanPenaltyPct(gCheck.group.paymentRules);
  const amtStr = fmtWalletAmount(args.amountUsdt);

  const [row] = await db
    .insert(groupAvecLoans)
    .values({
      groupId: args.groupId,
      borrowerUserId: args.borrowerUserId,
      initiatedByUserId: args.actorUserId,
      principalUsdt: amtStr,
      outstandingUsdt: amtStr,
      status: "pending",
      requiredApprovals: 0,
      interestRatePctMonth: String(interestPct),
      penaltyRatePct: String(penaltyPct),
      loanTermDays: AVEC_LOAN_MAX_DAYS,
    })
    .returning({ id: groupAvecLoans.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_loan_executing",
    after: { loanId: row.id, proposalId: args.proposalId },
  });

  const exec = await tryDisburseLoan({
    loanId: row.id,
    groupId: args.groupId,
    lastApproverUserId: args.actorUserId,
  });
  if (!exec.ok) return exec;
  return { ok: true, executed: exec.executed };
}

/** Member (non-manager) requests a loan for themselves - managers must accept then approve 2/3. */
export async function requestMemberLoan(args: {
  groupId: string;
  actorUserId: string;
  amountUsdt: number;
}): Promise<{ ok: true; loanId: string } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }
  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const gCheck = await assertGroupActive(args.groupId);
  if (!gCheck.ok) return gCheck;

  const saved = await memberSavedUsdt(args.groupId, args.actorUserId);
  const maxLoan = saved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER;
  if (args.amountUsdt > maxLoan + 1e-18) {
    return { ok: false, message: "group_loan_exceeds_limit" };
  }

  const db = getDb();
  const open = await db
    .select({ id: groupAvecLoans.id })
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.borrowerUserId, args.actorUserId),
        inArray(groupAvecLoans.status, ["requested", "pending", "disbursed"]),
      ),
    )
    .limit(1);
  if (open.length > 0) {
    return { ok: false, message: "group_loan_pending_exists" };
  }

  const amtStr = fmtWalletAmount(args.amountUsdt);
  const interestPct = getGroupLoanInterestPct(gCheck.group.paymentRules);
  const penaltyPct = getGroupLoanPenaltyPct(gCheck.group.paymentRules);
  const [row] = await db
    .insert(groupAvecLoans)
    .values({
      groupId: args.groupId,
      borrowerUserId: args.actorUserId,
      initiatedByUserId: args.actorUserId,
      principalUsdt: amtStr,
      outstandingUsdt: amtStr,
      status: "requested",
      requiredApprovals: 0,
      interestRatePctMonth: String(interestPct),
      penaltyRatePct: String(penaltyPct),
      loanTermDays: AVEC_LOAN_MAX_DAYS,
    })
    .returning({ id: groupAvecLoans.id });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  const borrowerDisplay = await userDisplayName(args.actorUserId);
  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_requested",
    after: { loanId: row.id, amountUsdt: args.amountUsdt },
  });

  try {
    const { notifyGroupMembers } = await import("@/lib/group-savings-notifications");
    const preview = `LOAN_REQUESTED|${args.amountUsdt.toFixed(2)}|${borrowerDisplay}`;
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      payload: {
        groupId: args.groupId,
        messageId: row.id,
        preview,
        senderEmail: "",
        messageType: "system",
      },
    });
  } catch {
    // optional
  }

  return { ok: true, loanId: row.id };
}

/** Manager accepts a member request → 2/3 queue (tier A) or collective vote (tier B/C). */
export async function acceptMemberLoanRequest(args: {
  groupId: string;
  loanId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; requiredApprovals: number }
  | {
      ok: true;
      governance: true;
      tier: "B" | "C";
      proposalId: string;
      voteClosesAt: string;
    }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!canManageGroupLoans(actor)) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [loan] = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.id, args.loanId),
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "requested"),
      ),
    )
    .limit(1);
  if (!loan) return { ok: false, message: "group_loan_not_found" };

  const amountUsdt = Number(loan.principalUsdt);
  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const tier = classifyLoanTier(amountUsdt);
  const now = new Date();

  if (tier === "C") {
    const gov = await createLoanCriticalProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      borrowerUserId: loan.borrowerUserId,
      amountUsdt,
    });
    if (!gov.ok) return gov;
    await db
      .update(groupAvecLoans)
      .set({
        status: "rejected",
        rejectionReason: "routed_to_collective_vote",
        updatedAt: now,
      })
      .where(eq(groupAvecLoans.id, args.loanId));
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      action: "loan_request_routed_to_vote",
      after: { loanId: args.loanId, proposalId: gov.proposalId, tier: "C" },
    });
    return {
      ok: true,
      governance: true,
      tier: "C",
      proposalId: gov.proposalId,
      voteClosesAt: gov.voteClosesAt,
    };
  }

  if (tier === "B") {
    const gov = await createLoanMediumProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      borrowerUserId: loan.borrowerUserId,
      amountUsdt,
    });
    if (!gov.ok) return gov;
    await db
      .update(groupAvecLoans)
      .set({
        status: "rejected",
        rejectionReason: "routed_to_committee_vote",
        updatedAt: now,
      })
      .where(eq(groupAvecLoans.id, args.loanId));
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      action: "loan_request_routed_to_vote",
      after: { loanId: args.loanId, proposalId: gov.proposalId, tier: "B" },
    });
    return {
      ok: true,
      governance: true,
      tier: "B",
      proposalId: gov.proposalId,
      voteClosesAt: gov.voteClosesAt,
    };
  }

  const managers = await listGroupManagers(args.groupId);
  const required = payoutRequiredApprovals(managers.length);

  await db
    .update(groupAvecLoans)
    .set({
      status: "pending",
      requiredApprovals: required,
      initiatedByUserId: args.actorUserId,
      updatedAt: now,
    })
    .where(eq(groupAvecLoans.id, args.loanId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_request_accepted",
    after: { loanId: args.loanId, requiredApprovals: required },
  });

  return { ok: true, requiredApprovals: required };
}

export async function rejectGroupLoan(args: {
  groupId: string;
  loanId: string;
  actorUserId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!canManageGroupLoans(actor)) {
    return { ok: false, message: "group_forbidden" };
  }

  const reason = args.reason?.trim() ?? "";
  if (reason.length < 3) {
    return { ok: false, message: "group_reject_reason_required" };
  }

  const db = getDb();
  const [loan] = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.id, args.loanId),
        eq(groupAvecLoans.groupId, args.groupId),
        inArray(groupAvecLoans.status, ["requested", "pending"]),
      ),
    )
    .limit(1);
  if (!loan) return { ok: false, message: "group_loan_not_found" };

  const now = new Date();
  await db
    .update(groupAvecLoans)
    .set({
      status: "rejected",
      rejectionReason: reason.slice(0, 500),
      updatedAt: now,
    })
    .where(eq(groupAvecLoans.id, args.loanId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_rejected",
    after: { loanId: args.loanId, reason },
  });

  const borrowerDisplay = await userDisplayName(loan.borrowerUserId);
  const preview = `LOAN_REJECTED|${Number(loan.principalUsdt).toFixed(2)}|${borrowerDisplay}|${reason}`;
  try {
    const { notifyGroupMembers } = await import("@/lib/group-savings-notifications");
    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      excludeUserId: args.actorUserId,
      payload: {
        groupId: args.groupId,
        messageId: loan.id,
        preview,
        senderEmail: "",
        messageType: "system",
      },
    });
    const { createUserNotification } = await import("@/lib/notifications-service");
    await createUserNotification({
      userId: loan.borrowerUserId,
      kind: "group_message",
      payload: { groupId: args.groupId, preview, messageType: "system" },
    });
  } catch {
    // optional
  }

  return { ok: true };
}

export async function approveGroupLoan(args: {
  groupId: string;
  loanId: string;
  actorUserId: string;
}): Promise<
  | { ok: true; executed: boolean; approvalCount: number; requiredApprovals: number }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!canManageGroupLoans(actor)) {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [loan] = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.id, args.loanId),
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "pending"),
      ),
    )
    .limit(1);
  if (!loan) return { ok: false, message: "group_loan_not_found" };

  const amountUsdt = Number(loan.principalUsdt);
  if (classifyLoanTier(amountUsdt) !== "A") {
    return { ok: false, message: "group_gov_loan_collective_required" };
  }

  if (args.actorUserId === loan.initiatedByUserId) {
    return { ok: false, message: "group_gov_initiator_cannot_vote" };
  }

  const dup = await db
    .select({ id: groupAvecLoanApprovals.id })
    .from(groupAvecLoanApprovals)
    .where(
      and(
        eq(groupAvecLoanApprovals.loanId, args.loanId),
        eq(groupAvecLoanApprovals.approverUserId, args.actorUserId),
      ),
    )
    .limit(1);
  if (dup.length > 0) {
    return { ok: false, message: "group_loan_already_approved" };
  }

  await db.insert(groupAvecLoanApprovals).values({
    loanId: args.loanId,
    approverUserId: args.actorUserId,
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_approved",
    after: { loanId: args.loanId },
  });

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupAvecLoanApprovals)
    .where(eq(groupAvecLoanApprovals.loanId, args.loanId));
  const approvalCount = countRows[0]?.n ?? 0;

  const exec = await tryDisburseLoan({
    loanId: args.loanId,
    groupId: args.groupId,
    lastApproverUserId: args.actorUserId,
  });
  if (!exec.ok) return exec;

  return {
    ok: true,
    executed: exec.executed,
    approvalCount,
    requiredApprovals: loan.requiredApprovals,
  };
}

export async function repayGroupLoan(args: {
  groupId: string;
  loanId: string;
  actorUserId: string;
  amountUsdt: number;
}): Promise<{ ok: true; repaid: boolean } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const db = getDb();
  const [loan] = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.id, args.loanId),
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "disbursed"),
      ),
    )
    .limit(1);
  if (!loan) return { ok: false, message: "group_loan_not_found" };

  const isBorrower = loan.borrowerUserId === args.actorUserId;
  const isManager = hasRole(m, ["admin", "co_admin"]);
  if (!isBorrower && !isManager) {
    return { ok: false, message: "group_forbidden" };
  }

  const charges = computeLoanCharges(loan);
  const alloc = allocateLoanRepayment(args.amountUsdt, charges);
  const pay = alloc.total;
  if (pay <= 0) return { ok: false, message: "group_loan_nothing_to_repay" };

  const payStr = fmtWalletAmount(pay);
  const batchId = randomUUID();

  try {
    await db.transaction(async (tx) => {
      if (isBorrower) {
        const [u] = await tx
          .select({ bal: users.balance })
          .from(users)
          .where(eq(users.id, args.actorUserId))
          .limit(1);
        if (numFromNumeric(u?.bal?.toString()) + 1e-18 < pay) {
          throw new Error("insufficient");
        }
        await debitUserAsset(tx, args.actorUserId, "USDT", payStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: args.actorUserId,
            entryType: "group_loan_repay_out",
            asset: "USDT",
            amount: `-${payStr}`,
            meta: {
              groupId: args.groupId,
              loanId: loan.id,
              penaltyUsdt: alloc.toPenalty,
              interestUsdt: alloc.toInterest,
              principalUsdt: alloc.toPrincipal,
            },
          },
        ]);
      }

      const repayLines = buildLoanRepayGroupLedgerLines({
        batchId,
        groupId: args.groupId,
        loanId: loan.id,
        borrowerUserId: loan.borrowerUserId,
        by: args.actorUserId,
        toPrincipal: alloc.toPrincipal,
        toInterest: alloc.toInterest,
        toPenalty: alloc.toPenalty,
      });
      if (repayLines.length > 0) {
        await tx.insert(groupWalletLedgerEntries).values(
          repayLines.map((line) => ({
            batchId,
            groupId: args.groupId,
            entryType: line.entryType,
            asset: "USDT" as const,
            amount: line.amount,
            meta: line.meta,
          })),
        );
      }

      const newOut = charges.principalOutstandingUsdt - alloc.toPrincipal;
      const now = new Date();
      await tx
        .update(groupAvecLoans)
        .set({
          outstandingUsdt: fmtWalletAmount(Math.max(0, newOut)),
          status: newOut <= 1e-12 ? "repaid" : "disbursed",
          updatedAt: now,
        })
        .where(eq(groupAvecLoans.id, args.loanId));
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "insufficient") return { ok: false, message: "trade_insufficient_usdt" };
    return { ok: false, message: "group_action_failed" };
  }

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "loan_repaid",
    after: {
      loanId: args.loanId,
      amountUsdt: pay,
      penaltyUsdt: alloc.toPenalty,
      interestUsdt: alloc.toInterest,
      principalUsdt: alloc.toPrincipal,
    },
  });

  const fullyRepaid = alloc.toPrincipal >= charges.principalOutstandingUsdt - 1e-12;
  return { ok: true, repaid: fullyRepaid };
}

export async function listGroupLoans(args: {
  groupId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      requested: Awaited<ReturnType<typeof mapRequestedLoan>>[];
      pending: Awaited<ReturnType<typeof mapPendingLoan>>[];
      active: Awaited<ReturnType<typeof mapActiveLoan>>[];
      history: Awaited<ReturnType<typeof mapHistoryLoan>>[];
      canManage: boolean;
      maxLoanMultiplier: number;
      myMaxLoanUsdt: number;
      loanInterestPct: number;
      loanPenaltyPct: number;
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const g = await getGroupOrNull(args.groupId);
  const loanInterestPct = getGroupLoanInterestPct(g?.paymentRules);
  const loanPenaltyPct = getGroupLoanPenaltyPct(g?.paymentRules);

  const db = getDb();
  const canManage = canManageGroupLoans(m);

  const requestedRows = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "requested"),
      ),
    )
    .orderBy(desc(groupAvecLoans.createdAt))
    .limit(10);

  const pendingRows = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "pending"),
      ),
    )
    .orderBy(desc(groupAvecLoans.createdAt))
    .limit(3);

  const activeRows = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        eq(groupAvecLoans.status, "disbursed"),
      ),
    )
    .orderBy(desc(groupAvecLoans.disbursedAt))
    .limit(20);

  const historyRows = await db
    .select()
    .from(groupAvecLoans)
    .where(
      and(
        eq(groupAvecLoans.groupId, args.groupId),
        inArray(groupAvecLoans.status, ["repaid", "rejected"]),
      ),
    )
    .orderBy(desc(groupAvecLoans.updatedAt))
    .limit(30);

  const mySaved = await memberSavedUsdt(args.groupId, args.userId);

  const requested = await Promise.all(
    requestedRows
      .filter((r) => canManage || r.borrowerUserId === args.userId)
      .map((r) => mapRequestedLoan(r)),
  );
  const pending = await Promise.all(pendingRows.map((r) => mapPendingLoan(r, args.userId)));
  const active = await Promise.all(activeRows.map((r) => mapActiveLoan(r)));
  const history = await Promise.all(
    historyRows
      .filter((r) => canManage || r.borrowerUserId === args.userId)
      .map((r) => mapHistoryLoan(r)),
  );

  return {
    ok: true,
    requested,
    pending,
    active,
    history,
    canManage,
    maxLoanMultiplier: AVEC_MAX_LOAN_SAVINGS_MULTIPLIER,
    myMaxLoanUsdt: mySaved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER,
    loanInterestPct,
    loanPenaltyPct,
  };
}

async function mapPendingLoan(
  r: typeof groupAvecLoans.$inferSelect,
  viewerUserId: string,
) {
  const db = getDb();
  const approvals = await db
    .select({ approverUserId: groupAvecLoanApprovals.approverUserId })
    .from(groupAvecLoanApprovals)
    .where(eq(groupAvecLoanApprovals.loanId, r.id));

  const approverIds = approvals.map((a) => a.approverUserId);
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

  const saved = await memberSavedUsdt(r.groupId, r.borrowerUserId);

  return {
    id: r.id,
    borrowerUserId: r.borrowerUserId,
    borrowerDisplay: await userDisplayName(r.borrowerUserId),
    initiatorDisplay: await userDisplayName(r.initiatedByUserId),
    amountUsdt: Number(r.principalUsdt),
    outstandingUsdt: Number(r.outstandingUsdt),
    requiredApprovals: r.requiredApprovals,
    approvalCount: approverIds.length,
    maxAllowedUsdt: saved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER,
    memberSavedUsdt: saved,
    myApproved: approverIds.includes(viewerUserId),
    approvers: approverUsers.map((u) => ({
      userId: u.id,
      displayName: p2pDisplayName({
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        piUsername: u.piUsername,
      }),
    })),
    createdAt: r.createdAt.toISOString(),
  };
}

async function mapRequestedLoan(r: typeof groupAvecLoans.$inferSelect) {
  const saved = await memberSavedUsdt(r.groupId, r.borrowerUserId);
  return {
    id: r.id,
    borrowerUserId: r.borrowerUserId,
    borrowerDisplay: await userDisplayName(r.borrowerUserId),
    amountUsdt: Number(r.principalUsdt),
    maxAllowedUsdt: saved * AVEC_MAX_LOAN_SAVINGS_MULTIPLIER,
    memberSavedUsdt: saved,
    createdAt: r.createdAt.toISOString(),
    isMemberRequest: r.initiatedByUserId === r.borrowerUserId,
  };
}

async function mapActiveLoan(r: typeof groupAvecLoans.$inferSelect) {
  const charges = computeLoanCharges(r);
  return {
    id: r.id,
    borrowerUserId: r.borrowerUserId,
    borrowerDisplay: await userDisplayName(r.borrowerUserId),
    principalUsdt: Number(r.principalUsdt),
    outstandingUsdt: charges.principalOutstandingUsdt,
    interestAccruedUsdt: charges.interestAccruedUsdt,
    penaltyUsdt: charges.penaltyUsdt,
    totalDueUsdt: charges.totalDueUsdt,
    isOverdue: charges.isOverdue,
    daysUntilPenalty: charges.daysUntilPenalty,
    disbursedAt: r.disbursedAt?.toISOString() ?? null,
  };
}

async function mapHistoryLoan(r: typeof groupAvecLoans.$inferSelect) {
  return {
    id: r.id,
    borrowerUserId: r.borrowerUserId,
    borrowerDisplay: await userDisplayName(r.borrowerUserId),
    principalUsdt: Number(r.principalUsdt),
    status: r.status,
    rejectionReason: r.rejectionReason ?? null,
    disbursedAt: r.disbursedAt?.toISOString() ?? null,
    updatedAt: r.updatedAt.toISOString(),
    interestRatePctMonth: numFromNumeric(r.interestRatePctMonth?.toString() ?? "2"),
    penaltyRatePct: numFromNumeric(r.penaltyRatePct?.toString() ?? "5"),
  };
}
