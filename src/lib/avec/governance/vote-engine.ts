import { and, eq } from "drizzle-orm";
import { getDb, groupProposals, groupVotes } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { canVoteAsCommittee } from "@/lib/avec/governance/committee";
import {
  buildVoteMeta,
} from "@/lib/avec/governance/proposal-engine";
import {
  assertVoterEligibleAt,
  countEligibleVotersAt,
} from "@/lib/avec/governance/voter-snapshot";
import { insertGovernanceVoteMessage } from "@/lib/avec/governance/governance-messaging";
import {
  executionDelayHours,
  tallyVote,
} from "@/lib/avec/governance/rules";
import type { VoteChoice } from "@/lib/avec/governance/types";
import { buildBallotDetail } from "@/lib/avec/governance/ballot-summary";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";

export async function castGovernanceVote(args: {
  groupId: string;
  proposalId: string;
  voterUserId: string;
  choice: VoteChoice;
}): Promise<
  | { ok: true; yesCount: number; noCount: number; abstainCount: number }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({
    groupId: args.groupId,
    userId: args.voterUserId,
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

  if (p.voteClosesAt && p.voteClosesAt.getTime() <= Date.now()) {
    return { ok: false, message: "group_gov_vote_closed" };
  }

  if (args.voterUserId === p.authorUserId) {
    return { ok: false, message: "group_gov_initiator_cannot_vote" };
  }

  const audience = p.voteAudience ?? "members";
  const asOf = p.voteOpensAt ?? p.createdAt ?? new Date();
  const snap = await assertVoterEligibleAt({
    groupId: args.groupId,
    userId: args.voterUserId,
    voteAudience: audience,
    asOf,
  });
  if (!snap.ok) return snap;
  if (audience === "committee") {
    const ok = await canVoteAsCommittee({
      groupId: args.groupId,
      userId: args.voterUserId,
    });
    if (!ok) return { ok: false, message: "group_gov_committee_only" };
  }

  const dup = await db
    .select({ id: groupVotes.id })
    .from(groupVotes)
    .where(
      and(
        eq(groupVotes.proposalId, args.proposalId),
        eq(groupVotes.voterUserId, args.voterUserId),
      ),
    )
    .limit(1);
  if (dup.length > 0) {
    return { ok: false, message: "group_gov_already_voted" };
  }

  await db.insert(groupVotes).values({
    proposalId: args.proposalId,
    voterUserId: args.voterUserId,
    choice: args.choice,
  });

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: args.voterUserId,
    action: "gov_vote_cast",
    after: { proposalId: args.proposalId, choice: args.choice },
  });

  const meta = await buildVoteMeta({
    proposalId: args.proposalId,
    groupId: args.groupId,
  });
  if (meta) {
    await insertGovernanceVoteMessage({
      groupId: args.groupId,
      actorUserId: args.voterUserId,
      messageType: "vote_progress",
      meta,
    });
  }

  return {
    ok: true,
    yesCount: meta?.yesCount ?? 0,
    noCount: meta?.noCount ?? 0,
    abstainCount: meta?.abstainCount ?? 0,
  };
}

export async function closeProposalVote(args: {
  proposalId: string;
  groupId: string;
}): Promise<"passed" | "rejected" | "expired" | "skipped"> {
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
  if (!p || !p.voteClosesAt || p.voteClosesAt.getTime() > Date.now()) {
    return "skipped";
  }

  const votes = await db
    .select({ choice: groupVotes.choice })
    .from(groupVotes)
    .where(eq(groupVotes.proposalId, args.proposalId));

  let yes = 0;
  let no = 0;
  let abstain = 0;
  let option1 = 0;
  let option2 = 0;
  let option3 = 0;
  let option4 = 0;
  for (const v of votes) {
    if (v.choice === "yes") yes++;
    else if (v.choice === "no") no++;
    else if (v.choice === "abstain") abstain++;
    else if (v.choice === "option_1") option1++;
    else if (v.choice === "option_2") option2++;
    else if (v.choice === "option_3") option3++;
    else if (v.choice === "option_4") option4++;
  }

  const eligibleCount = await countEligibleVotersAt({
    groupId: args.groupId,
    voteAudience: p.voteAudience ?? "members",
    asOf: p.voteOpensAt ?? p.createdAt ?? new Date(),
  });
  const payload = (p.payload ?? {}) as Record<string, unknown>;
  const ballot = await buildBallotDetail({
    groupId: args.groupId,
    type: p.type as import("@/lib/avec/governance/types").ProposalType,
    payload,
    beneficiaryUserId: p.beneficiaryUserId,
    financialImpactUsdt: p.financialImpactUsdt ? Number(p.financialImpactUsdt) : null,
    justification: p.justification,
  });
  const isQuizVote = (ballot.quizOptions?.length ?? 0) > 0;

  const result = isQuizVote
    ? (() => {
        const tallies = [option1 || yes, option2 || no, option3 || abstain, option4];
        const participated = tallies.reduce((n, x) => n + x, 0);
        const requiredQuorum = Math.max(
          1,
          Math.ceil((eligibleCount * Math.max(0, Math.min(100, p.requiredQuorumPct))) / 100),
        );
        if (participated < requiredQuorum) return "expired" as const;
        const sorted = tallies
          .map((count, idx) => ({ count, idx }))
          .sort((a, b) => b.count - a.count);
        if (sorted[0].count <= 0) return "expired" as const;
        if (sorted[1] && sorted[0].count === sorted[1].count) return "rejected" as const;
        return "passed" as const;
      })()
    : tallyVote({
        yes,
        no,
        abstain,
        eligibleCount,
        quorumPct: p.requiredQuorumPct,
        majorityPct: p.requiredMajorityPct,
      });

  const now = new Date();
  const delayH = executionDelayHours(p.type as import("@/lib/avec/governance/types").ProposalType);
  const executionScheduledAt =
    result === "passed" && delayH > 0
      ? new Date(now.getTime() + delayH * 3600000)
      : result === "passed"
        ? now
        : null;

  await db
    .update(groupProposals)
    .set({
      status: result,
      executionScheduledAt,
    })
    .where(eq(groupProposals.id, args.proposalId));

  const meta = await buildVoteMeta({
    proposalId: args.proposalId,
    groupId: args.groupId,
  });
  if (meta) {
    meta.status = result;
    meta.result = result;
    await insertGovernanceVoteMessage({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      messageType: "vote_closed",
      meta,
    });
  }

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: p.authorUserId,
    action: "gov_vote_closed",
    after: { proposalId: args.proposalId, result, yes, no, abstain, option1, option2, option3, option4 },
  });

  return result;
}
