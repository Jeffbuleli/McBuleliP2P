import type { GovernanceMode, ProposalType } from "@/lib/avec/governance/types";

export const DEFAULT_GOVERNANCE_RULES = {
  criticalWithdrawalUsdt: 500,
  criticalQuorumPct: 70,
  criticalMajorityPct: 60,
  payoutCriticalVoteHours: 48,
  policyVoteHours: 72,
  criticalWithdrawalExecutionDelayHours: 24,
} as const;

export function requiresGovernancePayout(args: {
  governanceMode: GovernanceMode | string | null | undefined;
  amountUsdt: number;
}): boolean {
  const mode = args.governanceMode ?? "legacy";
  if (mode === "legacy") return false;
  if (mode === "full") return true;
  return args.amountUsdt >= DEFAULT_GOVERNANCE_RULES.criticalWithdrawalUsdt;
}

export function voteDurationHours(type: ProposalType): number {
  if (type === "payout_critical") {
    return DEFAULT_GOVERNANCE_RULES.payoutCriticalVoteHours;
  }
  return DEFAULT_GOVERNANCE_RULES.policyVoteHours;
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
