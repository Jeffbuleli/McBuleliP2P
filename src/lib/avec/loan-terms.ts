import { numFromNumeric } from "@/lib/wallet-types";

/** 10 % interest accrued linearly over the first 30 days. */
export const AVEC_LOAN_INTEREST_PCT_TOTAL = 10;
export const AVEC_LOAN_INTEREST_PERIOD_DAYS = 30;

/** 20 % penalty if still outstanding 7+ days after the 30-day interest period. */
export const AVEC_LOAN_PENALTY_PCT = 20;
export const AVEC_LOAN_PENALTY_DAYS_LATE = 7;

/** Maximum loan duration (days from disbursement). */
export const AVEC_LOAN_MAX_DAYS = 90;

/** @deprecated use AVEC_LOAN_INTEREST_PCT_TOTAL — kept for DB column compatibility */
export const AVEC_DEFAULT_LOAN_INTEREST_PCT_MONTH = AVEC_LOAN_INTEREST_PCT_TOTAL;
export const AVEC_DEFAULT_LOAN_PENALTY_PCT = AVEC_LOAN_PENALTY_PCT;
export const AVEC_DEFAULT_LOAN_TERM_DAYS = AVEC_LOAN_MAX_DAYS;

export type LoanChargeBreakdown = {
  principalOutstandingUsdt: number;
  interestAccruedUsdt: number;
  penaltyUsdt: number;
  totalDueUsdt: number;
  daysSinceDisburse: number;
  daysUntilPenalty: number;
  isOverdue: boolean;
  interestPctTotal: number;
  penaltyPct: number;
  interestPeriodDays: number;
  maxDays: number;
};

export function computeLoanCharges(loan: {
  outstandingUsdt: string | number | null;
  disbursedAt: Date | null;
  interestRatePctMonth?: string | number | null;
  penaltyRatePct?: string | number | null;
  loanTermDays?: number | null;
}): LoanChargeBreakdown {
  const principalOutstandingUsdt = numFromNumeric(loan.outstandingUsdt?.toString() ?? "0");
  const interestPctTotal = AVEC_LOAN_INTEREST_PCT_TOTAL;
  const penaltyPct = AVEC_LOAN_PENALTY_PCT;
  const maxDays = AVEC_LOAN_MAX_DAYS;
  const interestPeriodDays = AVEC_LOAN_INTEREST_PERIOD_DAYS;

  if (principalOutstandingUsdt <= 0 || !loan.disbursedAt) {
    return {
      principalOutstandingUsdt,
      interestAccruedUsdt: 0,
      penaltyUsdt: 0,
      totalDueUsdt: principalOutstandingUsdt,
      daysSinceDisburse: 0,
      daysUntilPenalty: interestPeriodDays + AVEC_LOAN_PENALTY_DAYS_LATE,
      isOverdue: false,
      interestPctTotal,
      penaltyPct,
      interestPeriodDays,
      maxDays,
    };
  }

  const daysSinceDisburse = Math.max(
    0,
    (Date.now() - loan.disbursedAt.getTime()) / 86400000,
  );
  const interestDays = Math.min(daysSinceDisburse, interestPeriodDays);
  const interestAccruedUsdt =
    principalOutstandingUsdt *
    (interestPctTotal / 100) *
    (interestDays / interestPeriodDays);

  const daysAfterInterestPeriod = Math.max(0, daysSinceDisburse - interestPeriodDays);
  const daysUntilPenalty = Math.max(
    0,
    AVEC_LOAN_PENALTY_DAYS_LATE - daysAfterInterestPeriod,
  );
  const isOverdue = daysAfterInterestPeriod >= AVEC_LOAN_PENALTY_DAYS_LATE;
  const penaltyUsdt = isOverdue
    ? principalOutstandingUsdt * (penaltyPct / 100)
    : 0;

  const totalDueUsdt = principalOutstandingUsdt + interestAccruedUsdt + penaltyUsdt;

  return {
    principalOutstandingUsdt,
    interestAccruedUsdt,
    penaltyUsdt,
    totalDueUsdt,
    daysSinceDisburse,
    daysUntilPenalty,
    isOverdue,
    interestPctTotal,
    penaltyPct,
    interestPeriodDays,
    maxDays,
  };
}

/** Allocate repayment: penalties → interest → principal. */
export function allocateLoanRepayment(
  amountUsdt: number,
  charges: LoanChargeBreakdown,
): {
  toPenalty: number;
  toInterest: number;
  toPrincipal: number;
  total: number;
} {
  let remaining = Math.min(amountUsdt, charges.totalDueUsdt);
  const toPenalty = Math.min(remaining, charges.penaltyUsdt);
  remaining -= toPenalty;
  const toInterest = Math.min(remaining, charges.interestAccruedUsdt);
  remaining -= toInterest;
  const toPrincipal = Math.min(remaining, charges.principalOutstandingUsdt);
  return {
    toPenalty,
    toInterest,
    toPrincipal,
    total: toPenalty + toInterest + toPrincipal,
  };
}
