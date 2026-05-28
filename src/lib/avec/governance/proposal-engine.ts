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
import {
  canProposeGroupLoan,
  canProposeGroupPayout,
  canProposeGovernancePolicy,
  hasRole,
  getMyMembershipOrNull,
} from "@/lib/group-savings-permissions";
import { normalizeGranularAssignments } from "@/lib/avec/governance/granular-roles";
import { p2pDisplayName } from "@/lib/p2p-display";
import { validateSocialFundPerMeeting } from "@/lib/avec/social-fund-limits";
import { countCommitteeEligibleVoters } from "@/lib/avec/governance/committee";
import { countEligibleVotersAt } from "@/lib/avec/governance/voter-snapshot";
import {
  requiredParticipants,
  riskTierForType,
  voteAudienceForType,
  voteDurationHours,
  voteMajorityPct,
  voteQuorumPct,
} from "@/lib/avec/governance/rules";
import type { ClosureSnapshot } from "@/lib/avec/group-cycle-closure";
import { AVEC_MAX_SHARES_PER_MEETING } from "@/lib/group-savings-types";
import { numFromNumeric } from "@/lib/wallet-types";
import { insertGovernanceVoteMessage } from "@/lib/avec/governance/governance-messaging";
import { buildBallotDetail } from "@/lib/avec/governance/ballot-summary";
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

export async function countEligibleVotersForProposal(args: {
  groupId: string;
  voteAudience: string;
}): Promise<number> {
  if (args.voteAudience === "committee") {
    return countCommitteeEligibleVoters(args.groupId);
  }
  return countEligibleVoters(args.groupId);
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
  let option1Count = 0;
  let option2Count = 0;
  let option3Count = 0;
  let option4Count = 0;
  for (const v of votes) {
    if (v.choice === "yes") yesCount++;
    else if (v.choice === "no") noCount++;
    else if (v.choice === "abstain") abstainCount++;
    else if (v.choice === "option_1") option1Count++;
    else if (v.choice === "option_2") option2Count++;
    else if (v.choice === "option_3") option3Count++;
    else if (v.choice === "option_4") option4Count++;
  }

  const voteAudience = (p.voteAudience ?? "members") as import("@/lib/avec/governance/types").VoteAudience;
  const eligibleCount = await countEligibleVotersAt({
    groupId: args.groupId,
    voteAudience,
    asOf: p.voteOpensAt ?? p.createdAt ?? new Date(),
  });
  const requiredQuorum = requiredParticipants(eligibleCount, p.requiredQuorumPct);
  const beneficiaryDisplay = p.beneficiaryUserId
    ? await userDisplayName(p.beneficiaryUserId)
    : undefined;

  const payload = (p.payload ?? {}) as Record<string, unknown>;
  const ballot = await buildBallotDetail({
    groupId: args.groupId,
    type: p.type as ProposalType,
    payload,
    beneficiaryUserId: p.beneficiaryUserId,
    financialImpactUsdt: p.financialImpactUsdt ? Number(p.financialImpactUsdt) : null,
    justification: p.justification,
  });
  const hasQuiz = (ballot.quizOptions?.length ?? 0) > 0;
  const optionTallies = hasQuiz
    ? [
        {
          choice: "option_1" as const,
          label: ballot.quizOptions?.[0] ?? "Option 1",
          count: option1Count || yesCount,
        },
        {
          choice: "option_2" as const,
          label: ballot.quizOptions?.[1] ?? "Option 2",
          count: option2Count || noCount,
        },
        {
          choice: "option_3" as const,
          label: ballot.quizOptions?.[2] ?? "Option 3",
          count: option3Count || abstainCount,
        },
        {
          choice: "option_4" as const,
          label: ballot.quizOptions?.[3] ?? "Option 4",
          count: option4Count,
        },
      ].filter((x) => x.label)
    : undefined;
  const participated = hasQuiz
    ? (optionTallies ?? []).reduce((n, x) => n + x.count, 0)
    : yesCount + noCount + abstainCount;

  const closesAt = p.voteClosesAt?.getTime() ?? 0;
  const timeRemainingMs =
    p.status === "voting" && closesAt > Date.now() ? closesAt - Date.now() : 0;
  const majorityProgressPct = hasQuiz
    ? (() => {
        const top = [...(optionTallies ?? [])].sort((a, b) => b.count - a.count)[0];
        return top && participated > 0 ? Math.round((top.count / participated) * 100) : 0;
      })()
    : yesCount + noCount > 0
      ? Math.round((yesCount / (yesCount + noCount)) * 100)
      : 0;
  const sortedTallies = [...(optionTallies ?? [])].sort((a, b) => b.count - a.count);
  const hasUniqueWinner =
    sortedTallies.length > 1 ? sortedTallies[0].count > sortedTallies[1].count : sortedTallies.length === 1;
  const winningChoice = hasUniqueWinner ? sortedTallies[0]?.choice : undefined;
  const winningLabel = hasUniqueWinner ? sortedTallies[0]?.label : undefined;

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
    requiredQuorum,
    requiredMajorityPct: p.requiredMajorityPct,
    voteClosesAt: p.voteClosesAt?.toISOString() ?? "",
    voteOpensAt: p.voteOpensAt?.toISOString(),
    status: p.status as ProposalStatus | "voting",
    financialImpactUsdt: p.financialImpactUsdt
      ? Number(p.financialImpactUsdt)
      : undefined,
    beneficiaryDisplay,
    riskTier: (p.riskTier ?? "C") as import("@/lib/avec/governance/types").RiskTier,
    voteAudience,
    retryCount: p.retryCount ?? 0,
    quorumReached: participated >= requiredQuorum,
    majorityProgressPct,
    winningChoice,
    winningLabel,
    optionTallies,
    timeRemainingMs,
    executionScheduledAt: p.executionScheduledAt?.toISOString(),
    ballot,
  };
}

export async function openProposalVoteFromRow(args: {
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

async function openProposalVote(args: {
  proposalId: string;
  groupId: string;
  authorUserId: string;
  type: ProposalType;
}): Promise<void> {
  return openProposalVoteFromRow(args);
}

export async function insertAndStartProposal(args: {
  groupId: string;
  authorUserId: string;
  type: ProposalType;
  title: string;
  justification: string;
  payload: Record<string, unknown>;
  financialImpactUsdt?: string;
  beneficiaryUserId?: string;
  retryCount?: number;
  parentProposalId?: string;
}): Promise<
  | { ok: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  const db = getDb();
  const audience = voteAudienceForType(args.type);
  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: args.groupId,
      authorUserId: args.authorUserId,
      type: args.type,
      riskTier: riskTierForType(args.type),
      status: "voting",
      title: args.title,
      justification: args.justification,
      payload: args.payload,
      financialImpactUsdt: args.financialImpactUsdt,
      beneficiaryUserId: args.beneficiaryUserId,
      voteAudience: audience,
      retryCount: args.retryCount ?? 0,
      parentProposalId: args.parentProposalId,
      requiredQuorumPct: voteQuorumPct(args.type),
      requiredMajorityPct: voteMajorityPct(args.type),
      voteOpensAt: new Date(),
      voteClosesAt: new Date(Date.now() + voteDurationHours(args.type) * 3600000),
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

  await openProposalVoteFromRow({
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

  const { assertWithinDailyTreasuryOutflowCap } = await import(
    "@/lib/avec/treasury-daily-limits"
  );
  const dailyCap = await assertWithinDailyTreasuryOutflowCap({
    groupId: args.groupId,
    additionalUsdt: args.amountUsdt,
  });
  if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

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
      requiredQuorumPct: voteQuorumPct("payout_critical"),
      requiredMajorityPct: voteMajorityPct("payout_critical"),
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

type MemberProposalType =
  | "revoke_admin"
  | "appoint_admin"
  | "revoke_member"
  | "transfer_fund_bucket"
  | "change_interest_rate"
  | "change_penalty_rate"
  | "set_co_admins"
  | "set_committee"
  | "set_granular_roles"
  | "change_social_fund"
  | "change_meeting_rules"
  | "change_charter"
  | "dissolve_group";

export async function createMemberProposal(args: {
  groupId: string;
  authorUserId: string;
  type: MemberProposalType;
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

  const adminOnly: MemberProposalType[] = [
    "set_co_admins",
    "set_committee",
    "set_granular_roles",
    "change_social_fund",
    "change_meeting_rules",
    "change_charter",
    "dissolve_group",
    "revoke_member",
    "transfer_fund_bucket",
  ];
  if (adminOnly.includes(args.type) && !canProposeGovernancePolicy(m)) {
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
  let title = args.title?.trim() ?? "";
  let financialImpactUsdt: string | undefined;

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
    if (!title) title = "Revoke administrator";
  } else if (args.type === "appoint_admin") {
    const targetUserId = String(args.payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "group_gov_invalid_payload" };
    const [target] = await db
      .select({ role: groupSavingsMemberships.role, status: groupSavingsMemberships.status })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
        ),
      )
      .limit(1);
    if (!target || target.status !== "approved") {
      return { ok: false, message: "group_gov_target_not_member" };
    }
    if (target.role === "admin") {
      return { ok: false, message: "group_gov_target_already_admin" };
    }
    if (!title) title = "Appoint group administrator";
  } else if (args.type === "revoke_member") {
    const targetUserId = String(args.payload.targetUserId ?? "");
    if (!targetUserId) return { ok: false, message: "group_gov_invalid_payload" };
    const [target] = await db
      .select({ role: groupSavingsMemberships.role, status: groupSavingsMemberships.status })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          eq(groupSavingsMemberships.userId, targetUserId),
        ),
      )
      .limit(1);
    if (!target || target.status !== "approved") {
      return { ok: false, message: "group_gov_target_not_member" };
    }
    if (target.role === "admin") {
      return { ok: false, message: "group_gov_cannot_revoke_admin_via_member" };
    }
    if (targetUserId === args.authorUserId) {
      return { ok: false, message: "group_gov_cannot_revoke_self" };
    }
    if (!title) title = "Exclude member from group";
  } else if (args.type === "transfer_fund_bucket") {
    const { validateBucketTransfer } = await import("@/lib/avec/fund-buckets");
    const check = await validateBucketTransfer({
      groupId: args.groupId,
      fromBucket: String(args.payload.fromBucket ?? ""),
      toBucket: String(args.payload.toBucket ?? ""),
      amountUsdt: Number(args.payload.amountUsdt),
    });
    if (!check.ok) return { ok: false, message: check.message };
    financialImpactUsdt = fmtWalletAmount(check.amountUsdt);
    if (!title) {
      title = `Transfer ${check.amountUsdt.toFixed(2)} USDT · ${check.fromBucket} → ${check.toBucket}`;
    }
  } else if (args.type === "change_interest_rate") {
    const rate = Number(args.payload.interestRatePctTotal);
    if (!Number.isFinite(rate) || rate < 1 || rate > 30) {
      return { ok: false, message: "group_gov_invalid_interest_rate" };
    }
    if (!title) title = `Loan interest → ${rate}%`;
  } else if (args.type === "change_penalty_rate") {
    const rate = Number(args.payload.penaltyRatePctTotal);
    if (!Number.isFinite(rate) || rate < 1 || rate > 50) {
      return { ok: false, message: "group_gov_invalid_penalty_rate" };
    }
    if (!title) title = `Loan penalty → ${rate}%`;
  } else if (args.type === "set_co_admins") {
    const ids = Array.isArray(args.payload.coAdminUserIds)
      ? (args.payload.coAdminUserIds as unknown[]).map(String).slice(0, 3)
      : [];
    if (ids.length > 0) {
      const members = await db
        .select({ status: groupSavingsMemberships.status })
        .from(groupSavingsMemberships)
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            inArray(groupSavingsMemberships.userId, ids),
          ),
        );
      if (members.some((x) => x.status !== "approved")) {
        return { ok: false, message: "group_invalid_coadmins" };
      }
    }
    if (!title) title = "Update co-administrators";
  } else if (args.type === "set_committee") {
    const ids = Array.isArray(args.payload.committeeUserIds)
      ? (args.payload.committeeUserIds as unknown[]).map(String).slice(0, 7)
      : [];
    if (ids.length > 0) {
      const members = await db
        .select({ status: groupSavingsMemberships.status, role: groupSavingsMemberships.role })
        .from(groupSavingsMemberships)
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            inArray(groupSavingsMemberships.userId, ids),
          ),
        );
      if (
        members.length !== ids.length ||
        members.some((x) => x.status !== "approved" || x.role === "admin")
      ) {
        return { ok: false, message: "group_invalid_committee" };
      }
    }
    if (!title) title = "Update committee members";
  } else if (args.type === "set_granular_roles") {
    const assignments = normalizeGranularAssignments(args.payload.assignments);
    if (assignments.length === 0) {
      return { ok: false, message: "group_gov_invalid_granular_roles" };
    }
    const ids = assignments.map((a) => a.userId);
    const members = await db
      .select({ status: groupSavingsMemberships.status, role: groupSavingsMemberships.role })
      .from(groupSavingsMemberships)
      .where(
        and(
          eq(groupSavingsMemberships.groupId, args.groupId),
          inArray(groupSavingsMemberships.userId, ids),
        ),
      );
    if (
      members.length !== ids.length ||
      members.some((x) => x.status !== "approved" || x.role === "admin")
    ) {
      return { ok: false, message: "group_gov_invalid_granular_roles" };
    }
    if (!title) title = "Update functional roles";
  } else if (args.type === "change_social_fund") {
    const socialFundUsdt = Number(args.payload.socialFundUsdt);
    if (!Number.isFinite(socialFundUsdt) || socialFundUsdt < 0) {
      return { ok: false, message: "group_gov_invalid_payload" };
    }
    const shareValue = numFromNumeric(gCheck.group.contributionAmountUsdt?.toString());
    const maxShares = gCheck.group.maxSharesPerMeeting ?? AVEC_MAX_SHARES_PER_MEETING;
    const err = validateSocialFundPerMeeting(socialFundUsdt, shareValue, maxShares);
    if (err) return { ok: false, message: err };
    financialImpactUsdt = fmtWalletAmount(socialFundUsdt);
    if (!title) title = `Social fund → ${socialFundUsdt.toFixed(2)} USDT/meeting`;
  } else if (args.type === "change_meeting_rules") {
    const maxShares = Number(args.payload.maxSharesPerMeeting);
    const cycleDays = Number(args.payload.cycleDurationDays ?? args.payload.cycleDays);
    const meetingDays = Number(args.payload.meetingIntervalDays);
    const hasShares =
      Number.isFinite(maxShares) && maxShares >= 1 && maxShares <= AVEC_MAX_SHARES_PER_MEETING;
    const hasCycle = Number.isFinite(cycleDays) && cycleDays >= 30 && cycleDays <= 720;
    const hasMeeting =
      Number.isFinite(meetingDays) && meetingDays >= 1 && meetingDays <= 31;
    if (!hasShares && !hasCycle && !hasMeeting) {
      return { ok: false, message: "group_gov_invalid_meeting_rules" };
    }
    if (!title) title = "Update meeting rules";
  } else if (args.type === "change_charter") {
    const desc = String(args.payload.publicDescription ?? "").trim();
    if (desc.length > 0 && desc.length < 10) {
      return { ok: false, message: "group_gov_invalid_charter" };
    }
    if (!title) title = "Update group charter (public profile)";
  } else if (args.type === "dissolve_group") {
    const { assertGroupCanDissolve } = await import("@/lib/avec/group-dissolution");
    const dCheck = await assertGroupCanDissolve(args.groupId);
    if (!dCheck.ok) return dCheck;
    if (!title) title = "Dissolve AVEC group";
  }

  return insertAndStartProposal({
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: args.type,
    title,
    justification,
    payload: args.payload,
    financialImpactUsdt,
  });
}

export async function createCycleClosureProposal(args: {
  groupId: string;
  actorUserId: string;
}): Promise<
  | {
      ok: true;
      proposalId: string;
      voteClosesAt: string;
      snapshot: ClosureSnapshot;
    }
  | { ok: false; message: string }
> {
  const { prepareCycleClosureSnapshot } = await import("@/lib/avec/group-cycle-closure");
  const prep = await prepareCycleClosureSnapshot({ groupId: args.groupId });
  if (!prep.ok) return prep;

  const gCheck = await assertGroupReady(args.groupId);
  if (!gCheck.ok) return gCheck;

  if (await hasOpenGovernanceVote(args.groupId)) {
    return { ok: false, message: "group_gov_proposal_open" };
  }

  const { snapshot, cycleNumber, distributableUsdt } = prep;
  const title = `Close cycle #${cycleNumber} · ${distributableUsdt.toFixed(2)} USDT`;
  const justification = `Collective approval to close cycle #${cycleNumber} and distribute ${distributableUsdt.toFixed(2)} USDT.`;

  const db = getDb();
  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      type: "cycle_closure",
      riskTier: "C",
      status: "voting",
      title,
      justification,
      financialImpactUsdt: fmtWalletAmount(distributableUsdt),
      payload: { snapshot, cycleNumber, distributableUsdt },
      requiredQuorumPct: voteQuorumPct("cycle_closure"),
      requiredMajorityPct: voteMajorityPct("cycle_closure"),
      voteOpensAt: new Date(),
      voteClosesAt: new Date(
        Date.now() + voteDurationHours("cycle_closure") * 3600000,
      ),
    })
    .returning({
      id: groupProposals.id,
      voteClosesAt: groupProposals.voteClosesAt,
    });

  if (!row?.id) return { ok: false, message: "group_action_failed" };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_proposal_created",
    after: { proposalId: row.id, type: "cycle_closure", cycleNumber },
  });

  await openProposalVote({
    proposalId: row.id,
    groupId: args.groupId,
    authorUserId: args.actorUserId,
    type: "cycle_closure",
  });

  return {
    ok: true,
    proposalId: row.id,
    voteClosesAt: row.voteClosesAt?.toISOString() ?? "",
    snapshot,
  };
}

export async function createLoanCriticalProposal(args: {
  groupId: string;
  authorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.authorUserId,
  });
  if (!canProposeGroupLoan(actor)) {
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

  const { assertWithinDailyTreasuryOutflowCap } = await import(
    "@/lib/avec/treasury-daily-limits"
  );
  const dailyCap = await assertWithinDailyTreasuryOutflowCap({
    groupId: args.groupId,
    additionalUsdt: args.amountUsdt,
  });
  if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

  if (await hasOpenGovernanceVote(args.groupId)) {
    return { ok: false, message: "group_gov_proposal_open" };
  }

  const beneficiaryDisplay = await userDisplayName(args.borrowerUserId);
  const title = `Loan ${args.amountUsdt.toFixed(2)} USDT → ${beneficiaryDisplay}`;
  const justification = `Collective approval for an internal loan of ${args.amountUsdt.toFixed(2)} USDT.`;

  const db = getDb();
  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: args.groupId,
      authorUserId: args.authorUserId,
      type: "loan_critical",
      riskTier: "C",
      status: "voting",
      title,
      justification,
      financialImpactUsdt: fmtWalletAmount(args.amountUsdt),
      beneficiaryUserId: args.borrowerUserId,
      payload: {
        borrowerUserId: args.borrowerUserId,
        amountUsdt: args.amountUsdt,
      },
      requiredQuorumPct: voteQuorumPct("loan_critical"),
      requiredMajorityPct: voteMajorityPct("loan_critical"),
      voteOpensAt: new Date(),
      voteClosesAt: new Date(
        Date.now() + voteDurationHours("loan_critical") * 3600000,
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
      type: "loan_critical",
      amountUsdt: args.amountUsdt,
      borrowerUserId: args.borrowerUserId,
    },
  });

  await openProposalVote({
    proposalId: row.id,
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: "loan_critical",
  });

  return {
    ok: true,
    proposalId: row.id,
    voteClosesAt: row.voteClosesAt?.toISOString() ?? "",
  };
}

export async function createPayoutMediumProposal(args: {
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
  if (!canProposeGroupPayout(actor)) {
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

  const { assertWithinDailyTreasuryOutflowCap } = await import(
    "@/lib/avec/treasury-daily-limits"
  );
  const dailyCap = await assertWithinDailyTreasuryOutflowCap({
    groupId: args.groupId,
    additionalUsdt: args.amountUsdt,
  });
  if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

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
    `Committee approval for withdrawal of ${args.amountUsdt.toFixed(2)} USDT.`;

  return insertAndStartProposal({
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: "payout_medium",
    title,
    justification,
    financialImpactUsdt: fmtWalletAmount(args.amountUsdt),
    beneficiaryUserId: args.toUserId,
    payload: { toUserId: args.toUserId, amountUsdt: args.amountUsdt },
  });
}

export async function createLoanMediumProposal(args: {
  groupId: string;
  authorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  const actor = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.authorUserId,
  });
  if (!canProposeGroupLoan(actor)) {
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

  const { assertWithinDailyTreasuryOutflowCap } = await import(
    "@/lib/avec/treasury-daily-limits"
  );
  const dailyCap = await assertWithinDailyTreasuryOutflowCap({
    groupId: args.groupId,
    additionalUsdt: args.amountUsdt,
  });
  if (!dailyCap.ok) return { ok: false, message: dailyCap.message };

  if (await hasOpenGovernanceVote(args.groupId)) {
    return { ok: false, message: "group_gov_proposal_open" };
  }

  const beneficiaryDisplay = await userDisplayName(args.borrowerUserId);
  const title = `Loan ${args.amountUsdt.toFixed(2)} USDT → ${beneficiaryDisplay}`;
  const justification = `Committee approval for loan of ${args.amountUsdt.toFixed(2)} USDT.`;

  return insertAndStartProposal({
    groupId: args.groupId,
    authorUserId: args.authorUserId,
    type: "loan_medium",
    title,
    justification,
    financialImpactUsdt: fmtWalletAmount(args.amountUsdt),
    beneficiaryUserId: args.borrowerUserId,
    payload: { borrowerUserId: args.borrowerUserId, amountUsdt: args.amountUsdt },
  });
}

export async function cancelGovernanceProposal(args: {
  groupId: string;
  proposalId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.actorUserId,
  });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const db = getDb();
  const [p] = await db
    .select()
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.id, args.proposalId),
        eq(groupProposals.groupId, args.groupId),
        eq(groupProposals.status, "voting"),
      ),
    )
    .limit(1);
  if (!p) return { ok: false, message: "group_gov_proposal_not_found" };

  const canCancel =
    p.authorUserId === args.actorUserId || hasRole(m, ["admin", "co_admin"]);
  if (!canCancel) return { ok: false, message: "group_forbidden" };

  await db
    .update(groupProposals)
    .set({ status: "cancelled" })
    .where(eq(groupProposals.id, args.proposalId));

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: "gov_proposal_cancelled",
    after: { proposalId: args.proposalId, type: p.type },
  });

  const meta = await buildVoteMeta({
    proposalId: args.proposalId,
    groupId: args.groupId,
  });
  if (meta) {
    meta.status = "cancelled";
    await insertGovernanceVoteMessage({
      groupId: args.groupId,
      actorUserId: args.actorUserId,
      messageType: "vote_closed",
      meta,
    });
  }

  return { ok: true };
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
