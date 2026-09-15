import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allocateLoanRepayment,
  computeLoanCharges,
  AVEC_LOAN_INTEREST_PCT_TOTAL,
  AVEC_LOAN_INTEREST_PERIOD_DAYS,
  AVEC_LOAN_PENALTY_PCT,
  AVEC_LOAN_PENALTY_DAYS_LATE,
} from "../loan-terms";
import { hasRole } from "../governance/membership-roles";
import {
  computeFinancialReliabilityScore,
  scoreLabel,
} from "../financial-reliability-score";

describe("computeLoanCharges", () => {
  it("returns zero charges when not disbursed", () => {
    const c = computeLoanCharges({
      outstandingUsdt: "100",
      disbursedAt: null,
    });
    assert.equal(c.principalOutstandingUsdt, 100);
    assert.equal(c.interestAccruedUsdt, 0);
    assert.equal(c.penaltyUsdt, 0);
    assert.equal(c.isOverdue, false);
  });

  it("accrues interest linearly over the first 30 days", () => {
    const halfPeriodMs =
      (AVEC_LOAN_INTEREST_PERIOD_DAYS / 2) * 86400000;
    const disbursedAt = new Date(Date.now() - halfPeriodMs);
    const c = computeLoanCharges({
      outstandingUsdt: "100",
      disbursedAt,
      interestRatePctMonth: AVEC_LOAN_INTEREST_PCT_TOTAL,
    });
    assert.ok(Math.abs(c.interestAccruedUsdt - 5) < 0.05);
    assert.equal(c.penaltyUsdt, 0);
    assert.equal(c.isOverdue, false);
  });

  it("applies penalty after interest period + late days", () => {
    const lateMs =
      (AVEC_LOAN_INTEREST_PERIOD_DAYS + AVEC_LOAN_PENALTY_DAYS_LATE + 1) *
      86400000;
    const disbursedAt = new Date(Date.now() - lateMs);
    const c = computeLoanCharges({
      outstandingUsdt: "100",
      disbursedAt,
      interestRatePctMonth: AVEC_LOAN_INTEREST_PCT_TOTAL,
      penaltyRatePct: AVEC_LOAN_PENALTY_PCT,
    });
    assert.ok(Math.abs(c.interestAccruedUsdt - 10) < 0.05);
    assert.ok(Math.abs(c.penaltyUsdt - 20) < 0.05);
    assert.equal(c.isOverdue, true);
    assert.ok(Math.abs(c.totalDueUsdt - 130) < 0.1);
  });
});

describe("allocateLoanRepayment", () => {
  it("allocates penalties → interest → principal", () => {
    const charges = {
      principalOutstandingUsdt: 100,
      interestAccruedUsdt: 10,
      penaltyUsdt: 20,
      totalDueUsdt: 130,
      daysSinceDisburse: 40,
      daysUntilPenalty: 0,
      isOverdue: true,
      interestPctTotal: 10,
      penaltyPct: 20,
      interestPeriodDays: 30,
      maxDays: 90,
    };
    const full = allocateLoanRepayment(130, charges);
    assert.equal(full.toPenalty, 20);
    assert.equal(full.toInterest, 10);
    assert.equal(full.toPrincipal, 100);
    assert.equal(full.total, 130);

    const partial = allocateLoanRepayment(25, charges);
    assert.equal(partial.toPenalty, 20);
    assert.equal(partial.toInterest, 5);
    assert.equal(partial.toPrincipal, 0);

    const tiny = allocateLoanRepayment(5, charges);
    assert.equal(tiny.toPenalty, 5);
    assert.equal(tiny.toInterest, 0);
    assert.equal(tiny.toPrincipal, 0);
  });

  it("caps allocation at total due (no overpay)", () => {
    const charges = computeLoanCharges({
      outstandingUsdt: "50",
      disbursedAt: new Date(),
    });
    const alloc = allocateLoanRepayment(9999, charges);
    assert.ok(alloc.total <= charges.totalDueUsdt + 1e-9);
  });
});

describe("repay permissions helpers", () => {
  it("blocks non-approved members from manager roles", () => {
    assert.equal(
      hasRole({ role: "admin", status: "pending" }, ["admin", "co_admin"]),
      false,
    );
    assert.equal(
      hasRole({ role: "member", status: "approved" }, ["admin", "co_admin"]),
      false,
    );
    assert.equal(
      hasRole({ role: "admin", status: "approved" }, ["admin", "co_admin"]),
      true,
    );
  });
});

describe("financial reliability score", () => {
  it("scores a strong member highly and explains factors", () => {
    const r = computeFinancialReliabilityScore({
      meetingsPaid: 12,
      sharesTotal: 40,
      membershipAgeDays: 180,
      kycApproved: true,
      loansTotal: 3,
      loansRepaid: 3,
      loansActive: 0,
      loansDefaultedOrLate: 0,
      contributionConsistencyPct: 95,
    });
    assert.ok(r.score >= 80);
    assert.equal(scoreLabel(r.score), "excellent");
    assert.ok(r.factors.length >= 4);
    assert.ok(r.factors.every((f) => f.maxPoints > 0));
  });

  it("penalizes late repayments and missing history", () => {
    const weak = computeFinancialReliabilityScore({
      meetingsPaid: 0,
      sharesTotal: 0,
      membershipAgeDays: 5,
      kycApproved: false,
      loansTotal: 2,
      loansRepaid: 0,
      loansActive: 1,
      loansDefaultedOrLate: 2,
      contributionConsistencyPct: 20,
    });
    assert.ok(weak.score < 50);
    assert.ok(["fair", "poor", "limited"].includes(scoreLabel(weak.score)));
  });
});
