import { proposeGroupLoan } from "@/lib/avec/group-loans";
import { createLoanCriticalProposal } from "@/lib/avec/governance/proposal-engine";
import { requiresCollectiveLoan } from "@/lib/avec/governance/rules";

export async function proposeGroupLoanWithGovernance(args: {
  groupId: string;
  actorUserId: string;
  borrowerUserId: string;
  amountUsdt: number;
}): Promise<
  | { ok: true; governance: false; loanId: string; requiredApprovals: number }
  | { ok: true; governance: true; proposalId: string; voteClosesAt: string }
  | { ok: false; message: string }
> {
  if (requiresCollectiveLoan(args.amountUsdt)) {
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
      proposalId: gov.proposalId,
      voteClosesAt: gov.voteClosesAt,
    };
  }

  const legacy = await proposeGroupLoan(args);
  if (!legacy.ok) return legacy;
  return { ...legacy, governance: false };
}
