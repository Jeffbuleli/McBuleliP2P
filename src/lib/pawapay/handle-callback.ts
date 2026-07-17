import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { fiatFreshpayTransactions, freshpayWebhookEvents, getDb } from "@/db";
import { walletLedgerEntries } from "@/db/schema";
import { cdfPerOneUsd } from "@/lib/fx";
import type { PawapayNormalizedCallback } from "@/lib/pawapay/types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { tryAwardReferralFromFiatDeposit } from "@/lib/referral-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function allowedFiat(currency: string): boolean {
  const c = currency.toUpperCase();
  return c === "CDF" || c === "USD";
}

async function insertWebhookEvent(args: {
  dedupKey: string;
  kind: string;
  providerReference: string;
  status: string;
  currency: string;
  amount: string;
  userId: string | null;
  effect: string;
  rawBody: string;
}): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .insert(freshpayWebhookEvents)
    .values({
      dedupKey: args.dedupKey,
      kind: args.kind,
      providerReference: args.providerReference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: args.userId,
      effect: args.effect,
      rawBody: args.rawBody,
    })
    .onConflictDoNothing()
    .returning({ id: freshpayWebhookEvents.id });
  return Boolean(row);
}

async function lookupTx(reference: string) {
  const db = getDb();
  const [tx] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, reference))
    .limit(1);
  return tx ?? null;
}

export async function handlePawapayCallback(
  payload: PawapayNormalizedCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (payload.kind === "deposit") {
    return handleDepositCallback(payload);
  }
  return handlePayoutCallback(payload);
}

async function handleDepositCallback(
  args: PawapayNormalizedCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dedupKey = `deposit:${args.reference}:${args.status}`;
  const tx = await lookupTx(args.reference);

  if (!allowedFiat(args.currency)) {
    await insertWebhookEvent({
      dedupKey,
      kind: "deposit",
      providerReference: args.reference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: tx?.userId ?? null,
      effect: "skipped_currency",
      rawBody: args.rawBody,
    });
    return { ok: true };
  }

  try {
    const db = getDb();
    await db
      .update(fiatFreshpayTransactions)
      .set({
        status:
          args.status === "COMPLETED"
            ? "COMPLETED"
            : args.status === "FAILED"
              ? "FAILED"
              : "PROCESSING",
        providerTxId: args.providerTxId || undefined,
        failureCode: args.status === "FAILED" ? args.failureCode : null,
        failureMessage: args.status === "FAILED" ? args.failureMessage : null,
        updatedAt: new Date(),
        completedAt: args.status === "COMPLETED" || args.status === "FAILED" ? new Date() : null,
      })
      .where(eq(fiatFreshpayTransactions.reference, args.reference));
  } catch {
    // best-effort
  }

  if (args.status !== "COMPLETED") {
    await insertWebhookEvent({
      dedupKey,
      kind: "deposit",
      providerReference: args.reference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: tx?.userId ?? null,
      effect: "non_final",
      rawBody: args.rawBody,
    });
    return { ok: true };
  }

  if (!tx || tx.kind !== "deposit" || !UUID_RE.test(tx.userId)) {
    await insertWebhookEvent({
      dedupKey,
      kind: "deposit",
      providerReference: args.reference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: tx?.userId ?? null,
      effect: tx?.kind !== "deposit" ? "wrong_kind" : "no_user",
      rawBody: args.rawBody,
    });
    return { ok: true };
  }

  const initiatedGross = Number(tx.amount);
  const callbackGross = Number(args.amount || tx.amount);
  const gross = Math.min(
    Number.isFinite(initiatedGross) && initiatedGross > 0 ? initiatedGross : callbackGross,
    Number.isFinite(callbackGross) && callbackGross > 0 ? callbackGross : initiatedGross,
  );
  if (!Number.isFinite(gross) || gross <= 0) {
    await insertWebhookEvent({
      dedupKey,
      kind: "deposit",
      providerReference: args.reference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId: tx.userId,
      effect: "invalid_amount",
      rawBody: args.rawBody,
    });
    return { ok: true };
  }

  const net = gross * (1 - FIAT_FEE_RATE);
  const fee = gross - net;
  const pocket = args.currency === "USD" ? "USD" : "CDF";
  const netStr = fmtWalletAmount(net);
  const feeUsdEq =
    pocket === "USD" ? fmtWalletAmount(fee) : fmtWalletAmount(fee / cdfPerOneUsd());

  const db = getDb();
  try {
    await db.transaction(async (t) => {
      const [inserted] = await t
        .insert(freshpayWebhookEvents)
        .values({
          dedupKey,
          kind: "deposit",
          providerReference: args.reference,
          status: args.status,
          currency: args.currency,
          amount: args.amount,
          userId: tx.userId,
          effect: "credited_fiat",
          rawBody: args.rawBody,
        })
        .onConflictDoNothing()
        .returning({ id: freshpayWebhookEvents.id });

      if (!inserted) return;

      const existing = await t
        .select({ id: walletLedgerEntries.id })
        .from(walletLedgerEntries)
        .where(sql`(${walletLedgerEntries.meta} ->> 'fiatDepositRef') = ${args.reference}`)
        .limit(1);
      if (existing.length > 0) return;

      await creditUserAsset(t, tx.userId, pocket, netStr);
      await insertWalletLedgerLines(t, [
        {
          batchId: randomUUID(),
          userId: tx.userId,
          entryType: "fiat_deposit",
          asset: pocket,
          amount: netStr,
          feeUsdEquivalent: feeUsdEq,
          meta: {
            gross: String(gross),
            feeRate: FIAT_FEE_RATE,
            fee: fmtWalletAmount(fee),
            fiatDepositRef: args.reference,
            rail: "pawapay",
          },
        },
      ]);
    });
  } catch {
    return { ok: false, message: "Persistence error." };
  }

  await tryAwardReferralFromFiatDeposit({
    userId: tx.userId,
    grossAmount: gross,
    currency: args.currency,
    feeUsdEquivalentStr: feeUsdEq,
    fiatDepositRef: args.reference,
  });

  return { ok: true };
}

async function handlePayoutCallback(
  args: PawapayNormalizedCallback,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dedupKey = `payout:${args.reference}:${args.status}`;
  const tx = await lookupTx(args.reference);
  const userId = tx?.userId ?? null;

  if (!allowedFiat(args.currency)) {
    await insertWebhookEvent({
      dedupKey,
      kind: "payout",
      providerReference: args.reference,
      status: args.status,
      currency: args.currency,
      amount: args.amount,
      userId,
      effect: "skipped_currency",
      rawBody: args.rawBody,
    });
    return { ok: true };
  }

  const effect =
    args.status === "COMPLETED"
      ? "payout_completed_logged"
      : args.status === "FAILED"
        ? "payout_failed_logged"
        : "payout_non_final";

  await insertWebhookEvent({
    dedupKey,
    kind: "payout",
    providerReference: args.reference,
    status: args.status,
    currency: args.currency,
    amount: args.amount,
    userId,
    effect,
    rawBody: args.rawBody,
  });

  try {
    const db = getDb();
    await db
      .update(fiatFreshpayTransactions)
      .set({
        status:
          args.status === "COMPLETED"
            ? "COMPLETED"
            : args.status === "FAILED"
              ? "FAILED"
              : "PROCESSING",
        providerTxId: args.providerTxId || undefined,
        failureCode: args.status === "FAILED" ? args.failureCode : null,
        failureMessage: args.status === "FAILED" ? args.failureMessage : null,
        updatedAt: new Date(),
        completedAt: args.status === "COMPLETED" || args.status === "FAILED" ? new Date() : null,
      })
      .where(eq(fiatFreshpayTransactions.reference, args.reference));
  } catch {
    // best-effort
  }

  if (args.status === "FAILED" && tx?.batchId && userId && UUID_RE.test(userId)) {
    const pocket = args.currency === "USD" ? "USD" : "CDF";
    const batchId = tx.batchId;
    const db = getDb();
    try {
      await db.transaction(async (t) => {
        const [inserted] = await t
          .insert(freshpayWebhookEvents)
          .values({
            dedupKey: `payout_refund:${args.reference}:${args.status}`,
            kind: "payout_refund",
            providerReference: args.reference,
            status: args.status,
            currency: args.currency,
            amount: args.amount,
            userId,
            effect: "refunded_gross",
            rawBody: args.rawBody,
          })
          .onConflictDoNothing()
          .returning({ id: freshpayWebhookEvents.id });
        if (!inserted) return;

        const existing = await t
          .select({ id: walletLedgerEntries.id })
          .from(walletLedgerEntries)
          .where(
            sql`${walletLedgerEntries.batchId} = ${batchId}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw_refund' and ((${walletLedgerEntries.meta} ->> 'fiatPayoutRef') = ${args.reference} or (${walletLedgerEntries.meta} ->> 'pawapayPayoutId') = ${args.reference})`,
          )
          .limit(1);
        if (existing.length > 0) return;

        const [withdrawRow] = await t
          .select({ amount: walletLedgerEntries.amount })
          .from(walletLedgerEntries)
          .where(
            sql`${walletLedgerEntries.batchId} = ${batchId}::uuid and ${walletLedgerEntries.userId} = ${userId}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw'`,
          )
          .limit(1);

        const grossFromLedger = withdrawRow ? Math.abs(Number(withdrawRow.amount)) : null;
        const net = Number(args.amount);
        const refundAmount = grossFromLedger ?? (Number.isFinite(net) && net > 0 ? net : 0);
        if (refundAmount <= 0) return;

        const refundStr = fmtWalletAmount(refundAmount);
        await creditUserAsset(t, userId, pocket, refundStr);
        await insertWalletLedgerLines(t, [
          {
            batchId,
            userId,
            entryType: "fiat_withdraw_refund",
            asset: pocket,
            amount: refundStr,
            feeUsdEquivalent: "0",
            meta: {
              fiatPayoutRef: args.reference,
              pawapayPayoutId: args.reference,
              reason: "payout_failed",
              refunded: grossFromLedger ? "gross" : "net_fallback",
              rail: "pawapay",
            },
          },
        ]);
      });
    } catch {
      // best-effort
    }
  }

  return { ok: true };
}
