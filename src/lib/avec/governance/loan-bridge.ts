import { proposeGroupLoan } from "@/lib/avec/group-loans";
import {
  createLoanCriticalProposal,
  createLoanMediumProposal,
} from "@/lib/avec/governance/proposal-engine";
import { classifyLoanTier } from "@/lib/avec/governance/rules";

export async function proposeGroupLoanWithGovernance(args: {
  groupId: string;
  actorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; governance: false; loanId: string; requiredApprovals: number }
  | {
      ok: true;
      governance: true;
      tier: "B" | "C";
      proposalId: string;
      voteClosesAt: string;
    }
  | { ok: false; message: string }
> {
  const tier = classifyLoanTier(args.amountUsdt);

  if (tier === "C") {
    const gov = await createLoanCriticalProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      borrowerUserId: args.borrowerUserId,
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
    const gov = await createLoanMediumProposal({
      groupId: args.groupId,
      authorUserId: args.actorUserId,
      borrowerUserId: args.borrowerUserId,
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

  const legacy = await proposeGroupLoan(args);
  if (!legacy.ok) return legacy;
  return { ...legacy, governance: false };
}
