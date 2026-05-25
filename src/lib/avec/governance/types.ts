export type GovernanceMode = "legacy" | "hybrid" | "full";

export type ProposalType =
  | "revoke_admin"
  | "revoke_member"
  | "transfer_fund_bucket"
  | "payout_critical"
  | "payout_medium"
  | "change_interest_rate"
  | "change_penalty_rate"
  | "set_co_admins"
  | "set_committee"
  | "set_granular_roles"
  | "change_social_fund"
  | "cycle_closure"
  | "loan_critical"
  | "loan_medium"
  | "social_aid_medium"
  | "social_aid_critical";

export type ProposalStatus =
  | "voting"
  | "passed"
  | "rejected"
  | "expired"
  | "executed"
  | "cancelled";

export type VoteChoice = "yes" | "no" | "abstain";

export type RiskTier = "A" | "B" | "C";

export type VoteAudience = "members" | "committee";

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
  riskTier?: RiskTier;
  voteAudience?: VoteAudience;
  retryCount?: number;
  quorumReached?: boolean;
};
