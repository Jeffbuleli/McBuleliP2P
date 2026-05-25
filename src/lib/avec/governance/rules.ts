import type { GovernanceMode, ProposalType, RiskTier, VoteAudience } from "@/lib/avec/governance/types";

export const DEFAULT_GOVERNANCE_RULES = {
  /** Tier A: legacy 2/3 managers */
  minorPayoutMaxUsdt: 50,
  minorLoanMaxUsdt: 50,
  /** Tier B: committee vote */
  mediumWithdrawalMaxUsdt: 499.99,
  mediumLoanMaxUsdt: 99.99,
  /** Tier C: full member vote */
  criticalWithdrawalUsdt: 500,
  criticalLoanUsdt: 100,
  committeeQuorumPct: 50,
  committeeMajorityPct: 50,
  criticalQuorumPct: 70,
  criticalMajorityPct: 60,
  ultraCriticalQuorumPct: 80,
  ultraCriticalMajorityPct: 66,
  committeeVoteHours: 24,
  payoutCriticalVoteHours: 48,
  policyVoteHours: 72,
  cycleClosureVoteHours: 96,
  criticalWithdrawalExecutionDelayHours: 24,
  maxVoteRetries: 3,
  /** Social aid: committee vote below this amount */
  socialAidCommitteeMaxUsdt: 50,
  socialAidMaxPerMemberUsdt: 200,
  socialAidMaxPerMonthGroupUsdt: 500,
  socialAidMinDaysBetweenRequests: 30,
} as const;

export type OperationTier = RiskTier;

export function classifyPayoutTier(amountUsdt: number): OperationTier {
  if (amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalWithdrawalUsdt) return "C";
  if (amountUsdt >= DEFAULT_GOVERNANCE_RULES.minorPayoutMaxUsdt) return "B";
  return "A";
}

export function classifyLoanTier(amountUsdt: number): OperationTier {
  if (amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalLoanUsdt) return "C";
  if (amountUsdt >= DEFAULT_GOVERNANCE_RULES.minorLoanMaxUsdt) return "B";
  return "A";
}

export function classifySocialAidTier(amountUsdt: number): OperationTier {
  if (amountUsdt >= DEFAULT_GOVERNANCE_RULES.socialAidCommitteeMaxUsdt) return "C";
  return "B";
}

export function socialAidProposalType(amountUsdt: number): "social_aid_medium" | "social_aid_critical" {
  return classifySocialAidTier(amountUsdt) === "B" ? "social_aid_medium" : "social_aid_critical";
}

export function isLegacyPayoutTier(tier: OperationTier): boolean {
  return tier === "A";
}

export function requiresCommitteePayout(amountUsdt: number): boolean {
  return classifyPayoutTier(amountUsdt) === "B";
}

export function requiresCollectiveLoan(amountUsdt: number): boolean {
  return amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalLoanUsdt;
}

export function requiresCommitteeLoan(amountUsdt: number): boolean {
  return classifyLoanTier(amountUsdt) === "B";
}

/** McBuleli AVEC — single platform model: large payouts → collective vote. */
export function requiresCollectivePayout(amountUsdt: number): boolean {
  return amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalWithdrawalUsdt;
}

/** @deprecated Use requiresCollectivePayout — governance_mode is ignored. */
export function requiresGovernancePayout(args: {
  governanceMode?: GovernanceMode | string | null;
  amountUsdt: number;
}): boolean {
  return requiresCollectivePayout(args.amountUsdt);
}

export function voteAudienceForType(type: ProposalType): VoteAudience {
  if (type === "payout_medium" || type === "loan_medium" || type === "social_aid_medium") {
    return "committee";
  }
  return "members";
}

export function voteDurationHours(type: ProposalType): number {
  if (type === "payout_critical" || type === "social_aid_critical") {
    return DEFAULT_GOVERNANCE_RULES.payoutCriticalVoteHours;
  }
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.cycleClosureVoteHours;
  if (
    type === "payout_medium" ||
    type === "loan_medium" ||
    type === "social_aid_medium"
  ) {
    return DEFAULT_GOVERNANCE_RULES.committeeVoteHours;
  }
  return DEFAULT_GOVERNANCE_RULES.policyVoteHours;
}

export function voteQuorumPct(type: ProposalType): number {
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.ultraCriticalQuorumPct;
  if (
    type === "payout_medium" ||
    type === "loan_medium" ||
    type === "social_aid_medium"
  ) {
    return DEFAULT_GOVERNANCE_RULES.committeeQuorumPct;
  }
  return DEFAULT_GOVERNANCE_RULES.criticalQuorumPct;
}

export function voteMajorityPct(type: ProposalType): number {
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.ultraCriticalMajorityPct;
  if (
    type === "payout_medium" ||
    type === "loan_medium" ||
    type === "social_aid_medium"
  ) {
    return DEFAULT_GOVERNANCE_RULES.committeeMajorityPct;
  }
  return DEFAULT_GOVERNANCE_RULES.criticalMajorityPct;
}

export function riskTierForType(type: ProposalType): RiskTier {
  if (
    type === "payout_medium" ||
    type === "loan_medium" ||
    type === "social_aid_medium"
  ) {
    return "B";
  }
  if (type === "social_aid_critical" || type === "payout_critical" || type === "cycle_closure") {
    return "C";
  }
  return "C";
}

export function executionDelayHours(type: ProposalType): number {
  if (type === "payout_critical") {
    return DEFAULT_GOVERNANCE_RULES.criticalWithdrawalExecutionDelayHours;
  }
  return 0;
}

export function requiredParticipants(
  eligibleCount: number,
  quorumPct: number,
): number {
  return Math.max(1, Math.ceil((eligibleCount * quorumPct) / 100));
}

export function tallyVote(args: {
  yes: number;
  no: number;
  abstain: number;
  eligibleCount: number;
  quorumPct: number;
  majorityPct: number;
}): "passed" | "rejected" | "expired" {
  const participated = args.yes + args.no + args.abstain;
  const quorum = requiredParticipants(args.eligibleCount, args.quorumPct);
  if (participated < quorum) return "expired";
  const yesPct = args.yes / (args.yes + args.no || 1);
  if (yesPct >= args.majorityPct / 100) return "passed";
  return "rejected";
}

export function getGroupLoanInterestPct(paymentRules: string | null | undefined): number {
  const rules = parseGroupPaymentRules(paymentRules);
  const rate = Number(rules.loanInterestPctTotal);
  if (Number.isFinite(rate) && rate >= 1 && rate <= 30) return rate;
  return 10;
}

export function parseGroupPaymentRules(raw: string | null | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const j = JSON.parse(raw) as unknown;
    return j && typeof j === "object" && !Array.isArray(j)
      ? (j as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function mergeGroupPaymentRules(
  raw: string | null | undefined,
  patch: Record<string, unknown>,
): string {
  return JSON.stringify({ ...parseGroupPaymentRules(raw), ...patch });
}
