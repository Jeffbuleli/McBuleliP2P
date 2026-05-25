import { and, eq, lte, sql } from "drizzle-orm";
import {
  getDb,
  groupProposals,
  groupSavingsGroups,
  groupSavingsMemberships,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { executeGovernancePayout } from "@/lib/group-savings-payouts";
import { closeProposalVote } from "@/lib/avec/governance/vote-engine";
import { mergeGroupPaymentRules } from "@/lib/avec/governance/rules";
import type { ProposalType } from "@/lib/avec/governance/types";

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

  if (type === "payout_critical") {
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
      if (r !== "skipped") closed++;
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
