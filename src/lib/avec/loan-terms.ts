import { numFromNumeric } from "@/lib/wallet-types";

export const AVEC_DEFAULT_LOAN_INTEREST_PCT_MONTH = 2;
export const AVEC_DEFAULT_LOAN_PENALTY_PCT = 5;
export const AVEC_DEFAULT_LOAN_TERM_DAYS = 90;

export type LoanChargeBreakdown = {
  principalOutstandingUsdt: number;
  interestAccruedUsdt: number;
  penaltyUsdt: number;
  totalDueUsdt: number;
  daysSinceDisburse: number;
  isOverdue: boolean;
  interestRatePctMonth: number;
  penaltyRatePct: number;
  loanTermDays: number;
};

export function computeLoanCharges(loan: {
  outstandingUsdt: string | number | null;
  disbursedAt: Date | null;
  interestRatePctMonth?: string | number | null;
  penaltyRatePct?: string | number | null;
  loanTermDays?: number | null;
}): LoanChargeBreakdown {
  const principalOutstandingUsdt = numFromNumeric(loan.outstandingUsdt?.toString() ?? "0");
  const interestRatePctMonth =
    loan.interestRatePctMonth != null
      ? numFromNumeric(String(loan.interestRatePctMonth))
      : AVEC_DEFAULT_LOAN_INTEREST_PCT_MONTH;
  const penaltyRatePct =
    loan.penaltyRatePct != null
      ? numFromNumeric(String(loan.penaltyRatePct))
      : AVEC_DEFAULT_LOAN_PENALTY_PCT;
  const loanTermDays = loan.loanTermDays ?? AVEC_DEFAULT_LOAN_TERM_DAYS;

  if (principalOutstandingUsdt <= 0 || !loan.disbursedAt) {
    return {
      principalOutstandingUsdt,
      interestAccruedUsdt: 0,
      penaltyUsdt: 0,
      totalDueUsdt: principalOutstandingUsdt,
      daysSinceDisburse: 0,
      isOverdue: false,
      interestRatePctMonth,
      penaltyRatePct,
      loanTermDays,
    };
  }

  const daysSinceDisburse = Math.max(
    0,
    (Date.now() - loan.disbursedAt.getTime()) / 86400000,
  );
  const months = daysSinceDisburse / 30;
  const interestAccruedUsdt =
    principalOutstandingUsdt * (interestRatePctMonth / 100) * months;
  const isOverdue = daysSinceDisburse > loanTermDays;
  const penaltyUsdt = isOverdue
    ? principalOutstandingUsdt * (penaltyRatePct / 100)
    : 0;
  const totalDueUsdt = principalOutstandingUsdt + interestAccruedUsdt + penaltyUsdt;

  return {
    principalOutstandingUsdt,
    interestAccruedUsdt,
    penaltyUsdt,
    totalDueUsdt,
    daysSinceDisburse,
    isOverdue,
    interestRatePctMonth,
    penaltyRatePct,
    loanTermDays,
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
