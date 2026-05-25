import { and, eq, lte, sql } from "drizzle-orm";
import {
  getDb,
  groupProposals,
  groupSavingsGroups,
  groupSavingsMemberships,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { executeGovernancePayout } from "@/lib/group-savings-payouts";
import { applyCoAdminsToGroup } from "@/lib/avec/governance/apply-co-admins";
import { applyCommitteeToGroup } from "@/lib/avec/governance/apply-committee";
import { applyGranularRolesToGroup } from "@/lib/avec/governance/apply-granular-roles";
import { maybeRetryExpiredProposal } from "@/lib/avec/governance/vote-retry";
import { closeProposalVote } from "@/lib/avec/governance/vote-engine";
import { mergeGroupPaymentRules } from "@/lib/avec/governance/rules";
import { executeClosureFromGovernance } from "@/lib/avec/group-cycle-closure";
import type { ClosureSnapshot } from "@/lib/avec/group-cycle-closure";
import { applyGroupSocialFundFromGovernance } from "@/lib/group-savings-meeting-params";
import { executeLoanFromGovernance } from "@/lib/avec/group-loans";
import {
  executeSocialAidFromGovernance,
  syncSocialAidRequestAfterVote,
} from "@/lib/avec/social-fund-aid";
import type { ProposalType } from "@/lib/avec/governance/types";
import {
  executeBucketTransfer,
  type FundBucket,
} from "@/lib/avec/fund-buckets";

async function executePassedProposal(args: {
  proposalId: string;
  groupId: string;
}): Promise<{ ok: boolean; message?: string }> {
  const db = getDb();
  const [p] = await db
    .select()
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.id, args.proposalId),
        eq(groupProposals.groupId, args.groupId),
        eq(groupProposals.status, "passed"),
      ),
    )
    .limit(1);
  if (!p || p.executedAt) return { ok: false, message: "skipped" };
  if (p.executionScheduledAt && p.executionScheduledAt.getTime() > Date.now()) {
    return { ok: false, message: "not_due" };
  }

  const type = p.type as ProposalType;
  const payload = (p.payload ?? {}) as Record<string, unknown>;

  if (type === "payout_critical" || type === "payout_medium") {
    const toUserId = String(payload.toUserId ?? p.beneficiaryUserId ?? "");
    const amountUsdt = Number(payload.amountUsdt ?? p.financialImpactUsdt ?? 0);
    if (!toUserId || !Number.isFinite(amountUsdt) || amountUsdt <= 0) {
      return { ok: false, message: "invalid_payload" };
    }
    const exec = await executeGovernancePayout({
      groupId: args.groupId,
      toUserId,
      amountUsdt,
      initiatedByUserId: p.authorUserId,
      actorUserId: p.authorUserId,
      proposalId: p.id,
    });
    if (!exec.ok) return { ok: false, message: exec.message };
  } else if (type === "revoke_admin") {
    const targetUserId = String(payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "invalid_payload" };
    await db
      .update(groupSavingsMemberships)
      .set({ role: "member" })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
          eq(groupSavingsMemberships.status, "approved"),
        ),
      );
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_admin_revoked",
      after: { proposalId: p.id, targetUserId },
    });
  } else if (type === "appoint_admin") {
    const targetUserId = String(payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "invalid_payload" };

    const admins = await db
      .select({ userId: groupSavingsMemberships.userId })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.role, "admin"),
          eq(groupSavingsMemberships.status, "approved"),
        ),
      );

    for (const a of admins) {
      if (a.userId === targetUserId) continue;
      await db
        .update(groupSavingsMemberships)
        .set({ role: "co_admin", updatedAt: new Date() })
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            eq(groupSavingsMemberships.userId, a.userId),
          ),
        );
    }

    await db
      .update(groupSavingsMemberships)
      .set({ role: "admin", updatedAt: new Date() })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
          eq(groupSavingsMemberships.status, "approved"),
        ),
      );

    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_admin_appointed",
      after: { proposalId: p.id, targetUserId, previousAdminIds: admins.map((x) => x.userId) },
    });
  } else if (type === "revoke_member") {
    const targetUserId = String(payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "invalid_payload" };
    await db
      .update(groupSavingsMemberships)
      .set({
        status: "revoked",
        role: "member",
        granularRoles: [],
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
          eq(groupSavingsMemberships.status, "approved"),
        ),
      );
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_member_revoked",
      after: { proposalId: p.id, targetUserId },
    });
  } else if (type === "transfer_fund_bucket") {
    const exec = await executeBucketTransfer({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      fromBucket: String(payload.fromBucket ?? "") as FundBucket,
      toBucket: String(payload.toBucket ?? "") as FundBucket,
      amountUsdt: Number(payload.amountUsdt),
      proposalId: p.id,
    });
    if (!exec.ok) return { ok: false, message: exec.message };
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_bucket_transfer",
      after: {
        proposalId: p.id,
        fromBucket: payload.fromBucket,
        toBucket: payload.toBucket,
        amountUsdt: payload.amountUsdt,
      },
    });
  } else if (type === "change_interest_rate") {
    const rate = Number(payload.interestRatePctTotal);
    if (!Number.isFinite(rate)) return { ok: false, message: "invalid_payload" };
    const [g] = await db
      .select({ paymentRules: groupSavingsGroups.paymentRules })
      .from(groupSavingsGroups)
      .where(eq(groupSavingsGroups.id, args.groupId))
      .limit(1);
    if (!g) return { ok: false, message: "group_not_found" };
    await db
      .update(groupSavingsGroups)
      .set({
        paymentRules: mergeGroupPaymentRules(g.paymentRules, {
          loanInterestPctTotal: rate,
        }),
        updatedAt: new Date(),
      })
      .where(eq(groupSavingsGroups.id, args.groupId));
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_interest_rate_changed",
      after: { proposalId: p.id, interestRatePctTotal: rate },
    });
  } else if (type === "change_penalty_rate") {
    const rate = Number(payload.penaltyRatePctTotal);
    if (!Number.isFinite(rate)) return { ok: false, message: "invalid_payload" };
    const [g] = await db
      .select({ paymentRules: groupSavingsGroups.paymentRules })
      .from(groupSavingsGroups)
      .where(eq(groupSavingsGroups.id, args.groupId))
      .limit(1);
    if (!g) return { ok: false, message: "group_not_found" };
    await db
      .update(groupSavingsGroups)
      .set({
        paymentRules: mergeGroupPaymentRules(g.paymentRules, {
          loanPenaltyPctTotal: rate,
        }),
        updatedAt: new Date(),
      })
      .where(eq(groupSavingsGroups.id, args.groupId));
    await writeGroupAudit({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      action: "gov_penalty_rate_changed",
      after: { proposalId: p.id, penaltyRatePctTotal: rate },
    });
  } else if (type === "set_co_admins") {
    const ids = Array.isArray(payload.coAdminUserIds)
      ? (payload.coAdminUserIds as unknown[]).map(String).slice(0, 3)
      : [];
    const applied = await applyCoAdminsToGroup({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      coAdminUserIds: ids,
      proposalId: p.id,
    });
    if (!applied.ok) return { ok: false, message: applied.message };
  } else if (type === "set_granular_roles") {
    const assignments = payload.assignments;
    const applied = await applyGranularRolesToGroup({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      assignments,
      proposalId: p.id,
    });
    if (!applied.ok) return { ok: false, message: applied.message };
  } else if (type === "change_social_fund") {
    const socialFundUsdt = Number(payload.socialFundUsdt);
    if (!Number.isFinite(socialFundUsdt)) {
      return { ok: false, message: "invalid_payload" };
    }
    const applied = await applyGroupSocialFundFromGovernance({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      socialFundUsdt,
      proposalId: p.id,
    });
    if (!applied.ok) return { ok: false, message: applied.message };
  } else if (type === "cycle_closure") {
    const snapshot = payload.snapshot as ClosureSnapshot | undefined;
    const cycleNumber = Number(payload.cycleNumber);
    const distributableUsdt = Number(
      payload.distributableUsdt ?? p.financialImpactUsdt ?? 0,
    );
    if (!snapshot || !Number.isFinite(cycleNumber) || distributableUsdt <= 0) {
      return { ok: false, message: "invalid_payload" };
    }
    const exec = await executeClosureFromGovernance({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      snapshot,
      cycleNumber,
      distributableUsdt,
      proposalId: p.id,
    });
    if (!exec.ok) return { ok: false, message: exec.message };
    if (!exec.executed) return { ok: false, message: "closure_not_executed" };
  } else if (type === "set_committee") {
    const ids = Array.isArray(payload.committeeUserIds)
      ? (payload.committeeUserIds as unknown[]).map(String).slice(0, 7)
      : [];
    const applied = await applyCommitteeToGroup({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      committeeUserIds: ids,
      proposalId: p.id,
    });
    if (!applied.ok) return { ok: false, message: applied.message };
  } else if (type === "social_aid_medium" || type === "social_aid_critical") {
    const exec = await executeSocialAidFromGovernance({
      groupId: args.groupId,
      proposalId: p.id,
      actorUserId: p.authorUserId,
    });
    if (!exec.ok) return { ok: false, message: exec.message };
  } else if (type === "loan_critical" || type === "loan_medium") {
    const borrowerUserId = String(
      payload.borrowerUserId ?? p.beneficiaryUserId ?? "",
    );
    const amountUsdt = Number(payload.amountUsdt ?? p.financialImpactUsdt ?? 0);
    if (!borrowerUserId || !Number.isFinite(amountUsdt) || amountUsdt <= 0) {
      return { ok: false, message: "invalid_payload" };
    }
    const exec = await executeLoanFromGovernance({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      borrowerUserId,
      amountUsdt,
      proposalId: p.id,
    });
    if (!exec.ok) return { ok: false, message: exec.message };
    if (!exec.executed) return { ok: false, message: "loan_not_disbursed" };
  } else {
    return { ok: false, message: "unknown_type" };
  }

  await db
    .update(groupProposals)
    .set({ status: "executed", executedAt: new Date() })
    .where(eq(groupProposals.id, args.proposalId));

  return { ok: true };
}

export async function runGovernanceTick(): Promise<{
  closed: number;
  executed: number;
  errors: string[];
}> {
  const db = getDb();
  const now = new Date();
  const errors: string[] = [];
  let closed = 0;
  let executed = 0;

  const votingDue = await db
    .select({ id: groupProposals.id, groupId: groupProposals.groupId })
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.status, "voting"),
        lte(groupProposals.voteClosesAt, now),
      ),
    )
    .limit(50);

  for (const row of votingDue) {
    try {
      const r = await closeProposalVote({
        proposalId: row.id,
        groupId: row.groupId,
      });
      if (r !== "skipped") {
        closed++;
        const [prop] = await db
          .select({ type: groupProposals.type })
          .from(groupProposals)
          .where(eq(groupProposals.id, row.id))
          .limit(1);
        if (
          (prop?.type === "social_aid_medium" ||
            prop?.type === "social_aid_critical") &&
          r !== "passed"
        ) {
          await syncSocialAidRequestAfterVote({
            proposalId: row.id,
            groupId: row.groupId,
            result: r,
          });
        }
        if (r === "expired") {
          try {
            await maybeRetryExpiredProposal({
              proposalId: row.id,
              groupId: row.groupId,
            });
          } catch (e) {
            errors.push(`retry:${row.id}:${String(e)}`);
          }
        }
      }
    } catch (e) {
      errors.push(`close:${row.id}:${String(e)}`);
    }
  }

  const executionDue = await db
    .select({ id: groupProposals.id, groupId: groupProposals.groupId })
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.status, "passed"),
        sql`${groupProposals.executedAt} IS NULL`,
        lte(groupProposals.executionScheduledAt, now),
      ),
    )
    .limit(50);

  for (const row of executionDue) {
    try {
      const r = await executePassedProposal({
        proposalId: row.id,
        groupId: row.groupId,
      });
      if (r.ok) executed++;
      else if (r.message && r.message !== "not_due" && r.message !== "skipped") {
        errors.push(`exec:${row.id}:${r.message}`);
      }
    } catch (e) {
      errors.push(`exec:${row.id}:${String(e)}`);
    }
  }

  return { closed, executed, errors };
}
