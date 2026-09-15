/**
 * Financial Reliability Score — indicative decision-aid for AVEC committees.
 * Deterministic, explainable, never auto-approves or rejects a loan.
 * Does not use race, religion, politics, or unrelated sensitive attributes.
 */

export type ReliabilityFactor = {
  id:
    | "savings_regularity"
    | "repayment_history"
    | "tenure"
    | "lateness"
    | "contribution_stability"
    | "kyc";
  labelEn: string;
  labelFr: string;
  points: number;
  maxPoints: number;
  rating: "excellent" | "good" | "fair" | "poor" | "n/a";
};

export type FinancialReliabilityResult = {
  score: number;
  maxScore: 100;
  factors: ReliabilityFactor[];
  disclaimerEn: string;
  disclaimerFr: string;
};

export type FinancialReliabilityInput = {
  meetingsPaid: number;
  sharesTotal: number;
  membershipAgeDays: number;
  kycApproved: boolean;
  loansTotal: number;
  loansRepaid: number;
  loansActive: number;
  /** Count of overdue active loans or historical defaults. */
  loansDefaultedOrLate: number;
  /** 0–100 estimated share of meetings where member contributed. */
  contributionConsistencyPct: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function rate(points: number, max: number): ReliabilityFactor["rating"] {
  if (max <= 0) return "n/a";
  const pct = points / max;
  if (pct >= 0.9) return "excellent";
  if (pct >= 0.7) return "good";
  if (pct >= 0.45) return "fair";
  return "poor";
}

export function scoreLabel(
  score: number,
): "excellent" | "good" | "fair" | "poor" | "limited" {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "limited";
}

export function computeFinancialReliabilityScore(
  input: FinancialReliabilityInput,
): FinancialReliabilityResult {
  const meetings = Math.max(0, input.meetingsPaid);
  const shares = Math.max(0, input.sharesTotal);
  const ageDays = Math.max(0, input.membershipAgeDays);
  const consistency = clamp(input.contributionConsistencyPct, 0, 100);

  // Savings regularity (0–25): meetings + shares engagement
  const meetingPts = clamp(meetings, 0, 8) * 2; // up to 16
  const sharePts = clamp(shares, 0, 18) * 0.5; // up to 9
  const savingsRaw = clamp(meetingPts + sharePts, 0, 25);
  const savings: ReliabilityFactor = {
    id: "savings_regularity",
    labelEn: "Savings regularity",
    labelFr: "Régularité d'épargne",
    points: Math.round(savingsRaw),
    maxPoints: 25,
    rating: rate(savingsRaw, 25),
  };

  // Contribution stability (0–20)
  const stabilityPts = (consistency / 100) * 20;
  const stability: ReliabilityFactor = {
    id: "contribution_stability",
    labelEn: "Contribution stability",
    labelFr: "Stabilité des contributions",
    points: Math.round(stabilityPts),
    maxPoints: 20,
    rating: rate(stabilityPts, 20),
  };

  // Repayment history (0–25)
  let repayPts = 12; // neutral baseline when no loans yet
  if (input.loansTotal > 0) {
    const repaidRatio = input.loansRepaid / input.loansTotal;
    repayPts = repaidRatio * 25;
  }
  const repayment: ReliabilityFactor = {
    id: "repayment_history",
    labelEn: "Repayment history",
    labelFr: "Historique de remboursement",
    points: Math.round(repayPts),
    maxPoints: 25,
    rating:
      input.loansTotal === 0 ? "n/a" : rate(repayPts, 25),
  };

  // Lateness (0–15): full points when no late/default
  const lateCount = Math.max(0, input.loansDefaultedOrLate);
  const latePts = lateCount === 0 ? 15 : clamp(15 - lateCount * 7, 0, 15);
  const lateness: ReliabilityFactor = {
    id: "lateness",
    labelEn: "Late payments",
    labelFr: "Retards",
    points: Math.round(latePts),
    maxPoints: 15,
    rating: rate(latePts, 15),
  };

  // Tenure (0–10)
  const tenurePts =
    ageDays >= 180 ? 10 : ageDays >= 90 ? 7 : ageDays >= 30 ? 4 : ageDays >= 7 ? 2 : 0;
  const tenure: ReliabilityFactor = {
    id: "tenure",
    labelEn: "Membership tenure",
    labelFr: "Ancienneté",
    points: tenurePts,
    maxPoints: 10,
    rating: rate(tenurePts, 10),
  };

  // KYC (0–5) — platform verification flag only
  const kycPts = input.kycApproved ? 5 : 0;
  const kyc: ReliabilityFactor = {
    id: "kyc",
    labelEn: "Identity verification",
    labelFr: "Vérification d'identité",
    points: kycPts,
    maxPoints: 5,
    rating: input.kycApproved ? "excellent" : "poor",
  };

  const factors = [savings, stability, repayment, lateness, tenure, kyc];
  const score = clamp(
    factors.reduce((s, f) => s + f.points, 0),
    0,
    100,
  );

  return {
    score: Math.round(score),
    maxScore: 100,
    factors,
    disclaimerEn:
      "Indicative decision-aid for the group committee. Not a bank credit score. Does not auto-approve loans.",
    disclaimerFr:
      "Aide à la décision indicative pour le comité. Ce n'est pas un score bancaire. N'approuve pas automatiquement un crédit.",
  };
}
