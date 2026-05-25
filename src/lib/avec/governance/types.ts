export type GovernanceMode = "legacy" | "hybrid" | "full";

export type ProposalType =
  | "revoke_admin"
  | "payout_critical"
  | "change_interest_rate";

export type ProposalStatus =
  | "voting"
  | "passed"
  | "rejected"
  | "expired"
  | "executed"
  | "cancelled";

export type VoteChoice = "yes" | "no" | "abstain";

export type RiskTier = "C";

export type GovernanceVoteMeta = {
  proposalId: string;
  proposalType: ProposalType;
  title: string;
  authorUserId: string;
  authorDisplay: string;
  yesCount: number;
  noCount: number;
  abstainCount: number;
  eligibleCount: number;
  requiredQuorum: number;
  requiredMajorityPct: number;
  voteClosesAt: string;
  status: ProposalStatus | "voting";
  result?: "passed" | "rejected" | "expired";
  financialImpactUsdt?: number;
  beneficiaryDisplay?: string;
};
