import { proposeGroupPayout } from "@/lib/group-savings-payouts";
import {
  createPayoutCriticalProposal,
  createPayoutMediumProposal,
} from "@/lib/avec/governance/proposal-engine";
import {
  classifyPayoutTier,
  requiresCollectivePayout,
} from "@/lib/avec/governance/rules";

export async function proposeGroupPayoutWithGovernance(args: {
  groupId: string;
  actorUserId: string;
  toUserId: string;
  amountUsdt: number;
}): Promise<
  | {
      ok: true;
      governance: false;
      requestId: string;
      requiredApprovals: number;
      approvalCount: number;
    }
  | {
      ok: true;
      governance: true;
      tier: "B" | "C";
      proposalId: string;
      voteClosesAt: string;
    }
  | { ok: false; message: string }
> {
  const tier = classifyPayoutTier(args.amountUsdt);

  if (tier === "C" || requiresCollectivePayout(args.amountUsdt)) {
    const gov = await createPayoutCriticalProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      toUserId: args.toUserId,
      amountUsdt: args.amountUsdt,
    });
    if (!gov.ok) return gov;
    return {
      ok: true,
      governance: true,
      tier: "C",
      proposalId: gov.proposalId,
      voteClosesAt: gov.voteClosesAt,
    };
  }

  if (tier === "B") {
    const gov = await createPayoutMediumProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      toUserId: args.toUserId,
      amountUsdt: args.amountUsdt,
    });
    if (!gov.ok) return gov;
    return {
      ok: true,
      governance: true,
      tier: "B",
      proposalId: gov.proposalId,
      voteClosesAt: gov.voteClosesAt,
    };
  }

  const legacy = await proposeGroupPayout(args);
  if (!legacy.ok) return legacy;
  return { ...legacy, governance: false };
}
