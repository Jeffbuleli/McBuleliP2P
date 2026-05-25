import type { GovernanceMode, ProposalType } from "@/lib/avec/governance/types";

export const DEFAULT_GOVERNANCE_RULES = {
  criticalWithdrawalUsdt: 500,
  /** Loans at or above this amount require a member vote (not 2/3 managers alone). */
  criticalLoanUsdt: 100,
  criticalQuorumPct: 70,
  criticalMajorityPct: 60,
  ultraCriticalQuorumPct: 80,
  ultraCriticalMajorityPct: 66,
  payoutCriticalVoteHours: 48,
  policyVoteHours: 72,
  cycleClosureVoteHours: 96,
  criticalWithdrawalExecutionDelayHours: 24,
} as const;

export function getGroupLoanInterestPct(paymentRules: string | null | undefined): number {
  const rules = parseGroupPaymentRules(paymentRules);
  const rate = Number(rules.loanInterestPctTotal);
  if (Number.isFinite(rate) && rate >= 1 && rate <= 30) return rate;
  return 10;
}

export function requiresCollectiveLoan(amountUsdt: number): boolean {
  return amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalLoanUsdt;
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

export function voteDurationHours(type: ProposalType): number {
  if (type === "payout_critical") return DEFAULT_GOVERNANCE_RULES.payoutCriticalVoteHours;
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.cycleClosureVoteHours;
  return DEFAULT_GOVERNANCE_RULES.policyVoteHours;
}

export function voteQuorumPct(type: ProposalType): number {
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.ultraCriticalQuorumPct;
  return DEFAULT_GOVERNANCE_RULES.criticalQuorumPct;
}

export function voteMajorityPct(type: ProposalType): number {
  if (type === "cycle_closure") return DEFAULT_GOVERNANCE_RULES.ultraCriticalMajorityPct;
  return DEFAULT_GOVERNANCE_RULES.criticalMajorityPct;
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
