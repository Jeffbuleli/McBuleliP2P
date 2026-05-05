import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  getDb,
  loanCollaterals,
  loanEvents,
  loans,
  lpPoolPositions,
  users,
} from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";

const LOAN_ASSET = "USDT";
const LOAN_STATUS_OPEN = "open";
const POS_ACTIVE = "active";

function clampNonNeg(n: number) {
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxLike = any;

export async function applyUsdtCreditWithAutoRepay(
  tx: TxLike,
  args: {
    userId: string;
    creditUsdtStr: string;
    source: string;
    meta?: Record<string, unknown> | null;
  },
): Promise<{ walletCreditUsdtStr: string; repaidUsdtStr: string; loanId: string | null }> {
  const credit = clampNonNeg(numFromNumeric(args.creditUsdtStr));
  if (credit <= 0) {
    return { walletCreditUsdtStr: fmtWalletAmount(0), repaidUsdtStr: fmtWalletAmount(0), loanId: null };
  }

  // v1: repay the most recent open loan (single-open enforced).
  const [openLoan] = await tx
    .select({
      id: loans.id,
      outstandingUsdt: loans.outstandingUsdt,
      status: loans.status,
    })
    .from(loans)
    .where(and(eq(loans.userId, args.userId), eq(loans.status, LOAN_STATUS_OPEN)))
    .orderBy(desc(loans.createdAt))
    .limit(1);

  const outstanding = openLoan ? clampNonNeg(numFromNumeric(openLoan.outstandingUsdt)) : 0;
  const repayAmt = openLoan ? Math.min(outstanding, credit) : 0;
  const walletCreditAmt = credit - repayAmt;

  if (repayAmt > 0 && openLoan) {
    const now = new Date();
    await tx.insert(loanEvents).values({
      loanId: openLoan.id,
      eventType: "repay",
      amountUsdt: fmtWalletAmount(repayAmt),
      meta: { source: args.source, ...(args.meta ?? {}) },
      createdAt: now,
    });

    const newOutstanding = Math.max(0, outstanding - repayAmt);
    await tx
      .update(loans)
      .set({
        outstandingUsdt: fmtWalletAmount(newOutstanding),
        status: newOutstanding <= 1e-12 ? "repaid" : LOAN_STATUS_OPEN,
        updatedAt: now,
      })
      .where(eq(loans.id, openLoan.id));
  }

  return {
    walletCreditUsdtStr: fmtWalletAmount(walletCreditAmt),
    repaidUsdtStr: fmtWalletAmount(repayAmt),
    loanId: openLoan?.id ?? null,
  };
}

export type LoansSnapshot = {
  ok: true;
  asset: "USDT";
  poolPrincipalUsdt: number;
  poolEligibleUsdt: number;
  ltv: number;
  borrowLimitUsdt: number;
  outstandingUsdt: number;
  openLoanId: string | null;
  openAprAnnual: number | null;
} | { ok: false; message: string };

export async function getLoansSnapshot(userId: string): Promise<LoansSnapshot> {
  const db = getDb();

  const [u] = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return { ok: false, message: "wallet_not_found" };

  const positions = await db
    .select({
      id: lpPoolPositions.id,
      amount: lpPoolPositions.amount,
    })
    .from(lpPoolPositions)
    .where(and(eq(lpPoolPositions.userId, userId), eq(lpPoolPositions.status, POS_ACTIVE)));

  const poolPrincipalUsdt = positions.reduce(
    (acc, p) => acc + clampNonNeg(numFromNumeric(p.amount)),
    0,
  );

  // v1: only pool principal counts as collateral. (Staking/trading used later as score/bonus)
  const ltv = 0.5;
  const poolEligibleUsdt = poolPrincipalUsdt;
  const borrowLimitUsdt = poolEligibleUsdt * ltv;

  const [openLoan] = await db
    .select({
      id: loans.id,
      outstandingUsdt: loans.outstandingUsdt,
      aprAnnual: loans.aprAnnual,
    })
    .from(loans)
    .where(and(eq(loans.userId, userId), eq(loans.status, LOAN_STATUS_OPEN)))
    .orderBy(desc(loans.createdAt))
    .limit(1);

  return {
    ok: true,
    asset: "USDT",
    poolPrincipalUsdt,
    poolEligibleUsdt,
    ltv,
    borrowLimitUsdt,
    outstandingUsdt: openLoan ? clampNonNeg(numFromNumeric(openLoan.outstandingUsdt)) : 0,
    openLoanId: openLoan?.id ?? null,
    openAprAnnual: openLoan ? clampNonNeg(numFromNumeric(openLoan.aprAnnual)) : null,
  };
}

export type CreateLoanArgs = {
  userId: string;
  amountUsdtStr: string;
};

export async function createLoan(
  args: CreateLoanArgs,
): Promise<{ ok: true; loanId: string } | { ok: false; message: string }> {
  const amount = Number(args.amountUsdtStr);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "loan_invalid_amount" };

  const db = getDb();
  const snap = await getLoansSnapshot(args.userId);
  if (!snap.ok) return snap;

  if (snap.openLoanId) return { ok: false, message: "loan_open_exists" };
  if (snap.borrowLimitUsdt <= 0) return { ok: false, message: "loan_not_eligible" };
  if (amount - 1e-12 > snap.borrowLimitUsdt) return { ok: false, message: "loan_above_limit" };

  const amtStr = fmtWalletAmount(amount);
  const batchId = randomUUID();
  const now = new Date();
  const aprAnnual = "0.12"; // v1 fixed; later: dynamic by score/tiers

  // Use all active pool positions as collateral (informational). No lock changes in v1.
  const positions = await db
    .select({
      id: lpPoolPositions.id,
      amount: lpPoolPositions.amount,
    })
    .from(lpPoolPositions)
    .where(and(eq(lpPoolPositions.userId, args.userId), eq(lpPoolPositions.status, POS_ACTIVE)));

  const posIds = positions.map((p) => p.id);
  if (posIds.length === 0) return { ok: false, message: "loan_not_eligible" };

  const loanId = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(loans).values({
      id: loanId,
      userId: args.userId,
      asset: LOAN_ASSET,
      principalUsdt: amtStr,
      outstandingUsdt: amtStr,
      status: LOAN_STATUS_OPEN,
      aprAnnual,
      createdAt: now,
      updatedAt: now,
    });

    // Collateral allocation (pro-rata across positions, for future liquidation support).
    const poolPrincipal = positions.reduce(
      (acc, p) => acc + clampNonNeg(numFromNumeric(p.amount)),
      0,
    );
    const ltv = 0.5;
    const neededCollateral = amount / ltv;

    const rows = positions.map((p) => {
      const pAmt = clampNonNeg(numFromNumeric(p.amount));
      const weight = poolPrincipal > 0 ? pAmt / poolPrincipal : 0;
      const collat = fmtWalletAmount(neededCollateral * weight);
      return {
        loanId,
        collateralType: "lp_pool_position",
        collateralId: p.id,
        collateralUsdt: collat,
        ltv: String(ltv),
        createdAt: now,
      };
    });
    await tx.insert(loanCollaterals).values(rows);

    await tx.insert(loanEvents).values({
      loanId,
      eventType: "disburse",
      amountUsdt: amtStr,
      meta: { batchId, aprAnnual, collateralPositions: posIds },
      createdAt: now,
    });

    // Disburse USDT to user balance (internal treasury funding assumed).
    await creditUserAsset(tx, args.userId, "USDT", amtStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: args.userId,
        entryType: "loan_disburse",
        asset: "USDT",
        amount: amtStr,
        meta: { loanId },
      },
    ]);
  });

  return { ok: true, loanId };
}

export type RepayLoanArgs = {
  userId: string;
  loanId: string;
  amountUsdtStr: string;
};

export async function repayLoan(
  args: RepayLoanArgs,
): Promise<{ ok: true; loanId: string; status: string } | { ok: false; message: string }> {
  const amount = Number(args.amountUsdtStr);
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, message: "loan_invalid_amount" };

  const db = getDb();
  const [loan] = await db
    .select({
      id: loans.id,
      userId: loans.userId,
      status: loans.status,
      outstandingUsdt: loans.outstandingUsdt,
    })
    .from(loans)
    .where(eq(loans.id, args.loanId))
    .limit(1);
  if (!loan || loan.userId !== args.userId) return { ok: false, message: "loan_not_found" };
  if (loan.status !== LOAN_STATUS_OPEN) return { ok: false, message: "loan_not_open" };

  const outstanding = clampNonNeg(numFromNumeric(loan.outstandingUsdt));
  const repayAmt = Math.min(outstanding, amount);
  if (repayAmt <= 0) return { ok: false, message: "loan_nothing_to_repay" };

  const repayStr = fmtWalletAmount(repayAmt);
  const batchId = randomUUID();
  const now = new Date();

  await db.transaction(async (tx) => {
    // Ensure user has enough (simple check; deeper checks handled by debit).
    const [u] = await tx
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    const bal = u ? clampNonNeg(numFromNumeric(u.balance)) : 0;
    if (bal + 1e-12 < repayAmt) {
      throw Object.assign(new Error("wallet_insufficient_balance"), { code: "wallet_insufficient_balance" });
    }

    await debitUserAsset(tx, args.userId, "USDT", repayStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId,
        userId: args.userId,
        entryType: "loan_repay",
        asset: "USDT",
        amount: `-${repayStr}`,
        meta: { loanId: args.loanId },
      },
    ]);

    await tx.insert(loanEvents).values({
      loanId: args.loanId,
      eventType: "repay",
      amountUsdt: repayStr,
      meta: { batchId },
      createdAt: now,
    });

    const newOutstanding = Math.max(0, outstanding - repayAmt);
    const newStatus = newOutstanding <= 1e-12 ? "repaid" : LOAN_STATUS_OPEN;
    await tx
      .update(loans)
      .set({
        outstandingUsdt: fmtWalletAmount(newOutstanding),
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(loans.id, args.loanId));
  }).catch((e) => {
    const msg =
      typeof e?.code === "string"
        ? e.code
        : typeof e?.message === "string" && e.message === "wallet_insufficient_balance"
          ? "wallet_insufficient_balance"
          : null;
    if (msg) return Promise.reject(Object.assign(new Error(msg), { message: msg }));
    return Promise.reject(e);
  });

  const [after] = await db
    .select({ status: loans.status })
    .from(loans)
    .where(eq(loans.id, args.loanId))
    .limit(1);

  return { ok: true, loanId: args.loanId, status: after?.status ?? LOAN_STATUS_OPEN };
}

export async function listOpenLoans(userId: string): Promise<{
  ok: true;
  loans: { id: string; principalUsdt: number; outstandingUsdt: number; aprAnnual: number; createdAt: string }[];
} | { ok: false; message: string }> {
  const db = getDb();
  const rows = await db
    .select({
      id: loans.id,
      principalUsdt: loans.principalUsdt,
      outstandingUsdt: loans.outstandingUsdt,
      aprAnnual: loans.aprAnnual,
      createdAt: loans.createdAt,
    })
    .from(loans)
    .where(and(eq(loans.userId, userId), inArray(loans.status, ["open", "repaid"])))
    .orderBy(desc(loans.createdAt))
    .limit(20);

  return {
    ok: true,
    loans: rows.map((r) => ({
      id: r.id,
      principalUsdt: clampNonNeg(numFromNumeric(r.principalUsdt)),
      outstandingUsdt: clampNonNeg(numFromNumeric(r.outstandingUsdt)),
      aprAnnual: clampNonNeg(numFromNumeric(r.aprAnnual)),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

