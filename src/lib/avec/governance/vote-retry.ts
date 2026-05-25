import { and, eq } from "drizzle-orm";
import { getDb, groupProposals } from "@/db";
import { writeGroupAudit } from "@/lib/group-savings-audit";
import { insertGovernanceVoteMessage } from "@/lib/avec/governance/governance-messaging";
import {
  buildVoteMeta,
  openProposalVoteFromRow,
} from "@/lib/avec/governance/proposal-engine";
import { DEFAULT_GOVERNANCE_RULES, voteDurationHours } from "@/lib/avec/governance/rules";
import type { ProposalType } from "@/lib/avec/governance/types";

/**
 * If a vote expired due to quorum, reopen up to maxVoteRetries times.
 * Returns new proposal id when retried.
 */
export async function maybeRetryExpiredProposal(args: {
  groupId: string;
  proposalId: string;
}): Promise<{ retried: boolean; newProposalId?: string }> {
  const db = getDb();
  const [p] = await db
    .select()
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.id, args.proposalId),
        eq(groupProposals.groupId, args.groupId),
        eq(groupProposals.status, "expired"),
      ),
    )
    .limit(1);
  if (!p) return { retried: false };

  const retryCount = p.retryCount ?? 0;
  if (retryCount >= DEFAULT_GOVERNANCE_RULES.maxVoteRetries) {
    return { retried: false };
  }

  const open = await db
    .select({ id: groupProposals.id })
    .from(groupProposals)
    .where(
      and(
        eq(groupProposals.groupId, args.groupId),
        eq(groupProposals.status, "voting"),
      ),
    )
    .limit(1);
  if (open.length > 0) return { retried: false };

  const type = p.type as ProposalType;
  const hours = voteDurationHours(type);
  const closesAt = new Date(Date.now() + hours * 3600000);

  const [row] = await db
    .insert(groupProposals)
    .values({
      groupId: p.groupId,
      authorUserId: p.authorUserId,
      type: p.type,
      riskTier: p.riskTier,
      status: "voting",
      title: p.title,
      justification: p.justification,
      financialImpactUsdt: p.financialImpactUsdt,
      beneficiaryUserId: p.beneficiaryUserId,
      payload: p.payload ?? {},
      requiredQuorumPct: p.requiredQuorumPct,
      requiredMajorityPct: p.requiredMajorityPct,
      voteAudience: p.voteAudience,
      retryCount: retryCount + 1,
      parentProposalId: p.parentProposalId ?? p.id,
      voteOpensAt: new Date(),
      voteClosesAt: closesAt,
    })
    .returning({ id: groupProposals.id });

  if (!row?.id) return { retried: false };

  await writeGroupAudit({
    groupId: args.groupId,
    actorUserId: p.authorUserId,
    action: "gov_vote_retry_opened",
    after: {
      previousProposalId: p.id,
      newProposalId: row.id,
      retryCount: retryCount + 1,
    },
  });

  await openProposalVoteFromRow({
    proposalId: row.id,
    groupId: args.groupId,
    authorUserId: p.authorUserId,
    type,
  });

  const meta = await buildVoteMeta({ proposalId: row.id, groupId: args.groupId });
  if (meta) {
    meta.retryCount = retryCount + 1;
    await insertGovernanceVoteMessage({
      groupId: args.groupId,
      actorUserId: p.authorUserId,
      messageType: "vote_retry",
      meta,
    });
  }

  return { retried: true, newProposalId: row.id };
}
