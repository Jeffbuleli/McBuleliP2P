import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  groupProposals,
  groupSavingsGroups,
  groupSavingsMemberships,
  groupVotes,
  users,
} from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { ensureGroupSubscriptionUpToDate } from "@/lib/group-savings-billing";
import { getGroupFundSummary } from "@/lib/avec/fund-buckets";
import { hasRole, getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { p2pDisplayName } from "@/lib/p2p-display";
import {
  DEFAULT_GOVERNANCE_RULES,
  executionDelayHours,
  requiredParticipants,
  voteDurationHours,
} from "@/lib/avec/governance/rules";
import { insertGovernanceVoteMessage } from "@/lib/avec/governance/governance-messaging";
import type {
  GovernanceVoteMeta,
  ProposalType,
  ProposalStatus,
} from "@/lib/avec/governance/types";
import { fmtWalletAmount } from "@/lib/wallet-types";

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

export async function countEligibleVoters(groupId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, groupId),
        eq(groupSavingsMemberships.status, "approved"),
      ),
    );
  return rows[0]?.n ?? 0;
}

async function assertGroupReady(groupId: string) {
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

async function hasOpenGovernanceVote(groupId: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .select({ id: groupProposals.id })
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.groupId, groupId),
        eq(groupProposals.status, "voting"),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function buildVoteMeta(args: {
  proposalId: string;
  groupId: string;
}): Promise<GovernanceVoteMeta | null> {
  const db = getDb();
  const [p] = await db
    .select()
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.id, args.proposalId),
        eq(groupProposals.groupId, args.groupId),
      ),
    )
    .limit(1);
  if (!p) return null;

  const votes = await db
    .select({ choice: groupVotes.choice })
    .from(groupVotes)
    .where(eq(groupVotes.proposalId, p.id));

  let yesCount = 0;
  let noCount = 0;
  let abstainCount = 0;
  for (const v of votes) {
    if (v.choice === "yes") yesCount++;
    else if (v.choice === "no") noCount++;
    else abstainCount++;
  }

  const eligibleCount = await countEligibleVoters(args.groupId);
  const beneficiaryDisplay = p.beneficiaryUserId
    ? await userDisplayName(p.beneficiaryUserId)
    : undefined;

  return {
    proposalId: p.id,
    proposalType: p.type as ProposalType,
    title: p.title,
    authorUserId: p.authorUserId,
    authorDisplay: await userDisplayName(p.authorUserId),
    yesCount,
    noCount,
    abstainCount,
    eligibleCount,
    requiredQuorum: requiredParticipants(eligibleCount, p.requiredQuorumPct),
    requiredMajorityPct: p.requiredMajorityPct,
    voteClosesAt: p.voteClosesAt?.toISOString() ?? "",
    status: p.status as ProposalStatus | "voting",
    financialImpactUsdt: p.financialImpactUsdt
      ? Number(p.financialImpactUsdt)
      : undefined,
    beneficiaryDisplay,
  };
}

async function openProposalVote(args: {
  proposalId: string;
  groupId: string;
  authorUserId: string;
  type: ProposalType;
}): Promise<void> {
  const db = getDb();
  const now = new Date();
  const hours = voteDurationHours(args.type);
  const closesAt = new Date(now.getTime() + hours * 3600000);

  await db
    .update(groupProposals)
    .set({
      status: "voting",
      voteOpensAt: now,
      voteClosesAt: closesAt,
    })
    .where(eq(groupProposals.id, args.proposalId));

  const meta = await buildVoteMeta({
    proposalId: args.proposalId,
    groupId: args.groupId,
  });
  if (!meta) return;

  await insertGovernanceVoteMessage({
    groupId: args.groupId,
    actorUserId: args.authorUserId,
    messageType: "vote_started",
    meta,
  });
}

export async function createPayoutCriticalProposal(args: {
  groupId: string;
  authorUserId: string;
  toUserId: string;
  amountUsdt: number;
  justification?: string;
}): Promise<
  | { ok: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.authorUserId,
  });
  if (!hasRole(actor, ["admin", "co_admin"])) {
    return { ok: false, message: "group_forbidden" };
  }

  const gCheck = await assertGroupReady(args.groupId);
  if (!gCheck.ok) return gCheck;

  if (!Number.isFinite(args.amountUsdt) || args.amountUsdt <= 0) {
    return { ok: false, message: "group_invalid_amount" };
  }

  const funds = await getGroupFundSummary(args.groupId);
  if (funds.availableUsdt + 1e-18 < args.amountUsdt) {
    return { ok: false, message: "group_insufficient_balance" };
  }

  const db = getDb();
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

  if (await hasOpenGovernanceVote(args.groupId)) {
    return { ok: false, message: "group_gov_proposal_open" };
  }

  const beneficiaryDisplay = await userDisplayName(args.toUserId);
  const title = `Payout ${args.amountUsdt.toFixed(2)} USDT → ${beneficiaryDisplay}`;
  const justification =
    args.justification?.trim() ||
    `Critical treasury withdrawal of ${args.amountUsdt.toFixed(2)} USDT.`;

  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: args.groupId,
      authorUserId: args.authorUserId,
      type: "payout_critical",
      riskTier: "C",
      status: "voting",
      title,
      justification,
      financialImpactUsdt: fmtWalletAmount(args.amountUsdt),
      beneficiaryUserId: args.toUserId,
      payload: {
        toUserId: args.toUserId,
        amountUsdt: args.amountUsdt,
      },
      requiredQuorumPct: DEFAULT_GOVERNANCE_RULES.criticalQuorumPct,
      requiredMajorityPct: DEFAULT_GOVERNANCE_RULES.criticalMajorityPct,
      voteOpensAt: new Date(),
      voteClosesAt: new Date(
        Date.now() + voteDurationHours("payout_critical") * 3600000,
      ),
    })
    .returning({
      id: groupProposals.id,
      voteClosesAt: groupProposals.voteClosesAt,
    });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.authorUserId,
    action: "gov_proposal_created",
    after: {
      proposalId: row.id,
      type: "payout_critical",
      amountUsdt: args.amountUsdt,
      toUserId: args.toUserId,
    },
  });

  await openProposalVote({
    proposalId: row.id,
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: "payout_critical",
  });

  return {
    ok: true,
    proposalId: row.id,
    voteClosesAt: row.voteClosesAt?.toISOString() ?? "",
  };
}

export async function createMemberProposal(args: {
  groupId: string;
  authorUserId: string;
  type: "revoke_admin" | "change_interest_rate";
  title?: string;
  justification: string;
  payload: Record<string, unknown>;
}): Promise<
  | { ok: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.authorUserId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const gCheck = await assertGroupReady(args.groupId);
  if (!gCheck.ok) return gCheck;

  const justification = args.justification.trim();
  if (justification.length < 10) {
    return { ok: false, message: "group_gov_justification_required" };
  }

  if (await hasOpenGovernanceVote(args.groupId)) {
    return { ok: false, message: "group_gov_proposal_open" };
  }

  const db = getDb();

  if (args.type === "revoke_admin") {
    const targetUserId = String(args.payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "group_gov_invalid_payload" };
    const [target] = await db
      .select({ role: groupSavingsMemberships.role })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
          eq(groupSavingsMemberships.status, "approved"),
        ),
      )
      .limit(1);
    if (!target || !hasRole({ role: target.role, status: "approved" }, ["admin", "co_admin"])) {
      return { ok: false, message: "group_gov_target_not_admin" };
    }
    if (targetUserId === args.authorUserId) {
      return { ok: false, message: "group_gov_cannot_revoke_self" };
    }
  }

  if (args.type === "change_interest_rate") {
    const rate = Number(args.payload.interestRatePctTotal);
    if (!Number.isFinite(rate) || rate < 1 || rate > 30) {
      return { ok: false, message: "group_gov_invalid_interest_rate" };
    }
  }

  const title =
    args.title?.trim() ||
    (args.type === "revoke_admin"
      ? "Revoke administrator"
      : "Change loan interest rate");

  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: args.groupId,
      authorUserId: args.authorUserId,
      type: args.type,
      riskTier: "C",
      status: "voting",
      title,
      justification,
      payload: args.payload,
      requiredQuorumPct: DEFAULT_GOVERNANCE_RULES.criticalQuorumPct,
      requiredMajorityPct: DEFAULT_GOVERNANCE_RULES.criticalMajorityPct,
      voteOpensAt: new Date(),
      voteClosesAt: new Date(
        Date.now() + voteDurationHours(args.type) * 3600000,
      ),
    })
    .returning({
      id: groupProposals.id,
      voteClosesAt: groupProposals.voteClosesAt,
    });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.authorUserId,
    action: "gov_proposal_created",
    after: { proposalId: row.id, type: args.type, payload: args.payload },
  });

  await openProposalVote({
    proposalId: row.id,
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: args.type,
  });

  return {
    ok: true,
    proposalId: row.id,
    voteClosesAt: row.voteClosesAt?.toISOString() ?? "",
  };
}

export async function listGroupProposals(args: {
  groupId: string;
  userId: string;
}): Promise<
  | { ok: true; proposals: GovernanceVoteMeta[] }
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
  const rows = await db
    .select({ id: groupProposals.id })
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.groupId, args.groupId),
        inArray(groupProposals.status, ["voting", "passed", "rejected", "expired", "executed"]),
      ),
    )
    .orderBy(desc(groupProposals.createdAt))
    .limit(20);

  const proposals: GovernanceVoteMeta[] = [];
  for (const r of rows) {
    const meta = await buildVoteMeta({ proposalId: r.id, groupId: args.groupId });
    if (meta) proposals.push(meta);
  }

  return { ok: true, proposals };
}
