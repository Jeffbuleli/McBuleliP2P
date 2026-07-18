import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { fiatFreshpayTransactions, freshpayWebhookEvents, getDb } from "@/db";
import { walletLedgerEntries } from "@/db/schema";
import { cdfPerOneUsd } from "@/lib/fx";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { tryAwardReferralFromFiatDeposit } from "@/lib/referral-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CardCallbackPayload = {
  status?: string;
  event?: string;
  merchant_reference?: string;
  transaction_uuid?: string;
  amount?: number | string;
  currency?: string;
  payment_status?: string;
  data?: {
    merchant_reference?: string;
    transaction_uuid?: string;
    amount?: number | string;
    currency?: string;
    payment_status?: string;
    status?: string;
  };
};

function refFromPayload(p: CardCallbackPayload): string | null {
  const ref = String(p.merchant_reference ?? p.data?.merchant_reference ?? "").trim();
  return ref || null;
}

function mapCardStatus(p: CardCallbackPayload): "COMPLETED" | "FAILED" | "PROCESSING" {
  const parts = [
    p.status,
    p.payment_status,
    p.event,
    p.data?.payment_status,
    p.data?.status,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  if (parts.some((s) => s.includes("fail") || s.includes("declin") || s.includes("cancel"))) {
    return "FAILED";
  }
  if (parts.some((s) => s.includes("success") || s.includes("complete") || s.includes("paid"))) {
    return "COMPLETED";
  }
  return "PROCESSING";
}

export async function handleFreshpayCardCallback(
  payload: CardCallbackPayload,
  rawBody: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const reference = refFromPayload(payload);
  if (!reference) {
    return { ok: false, message: "Missing merchant_reference." };
  }

  const txStatus = mapCardStatus(payload);
  const currency = String(payload.currency ?? payload.data?.currency ?? "").toUpperCase();
  const amount = String(payload.amount ?? payload.data?.amount ?? "");
  const providerTxId = String(payload.transaction_uuid ?? payload.data?.transaction_uuid ?? "");

  const db = getDb();
  const [tx] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, reference))
    .limit(1);

  const dedupKey = `card:${reference}:${txStatus}`;

  if (txStatus !== "COMPLETED") {
    if (tx) {
      await db
        .update(fiatFreshpayTransactions)
        .set({
          status: txStatus === "FAILED" ? "FAILED" : "PROCESSING",
          providerTxId: providerTxId || undefined,
          updatedAt: new Date(),
          completedAt: txStatus === "FAILED" ? new Date() : null,
        })
        .where(eq(fiatFreshpayTransactions.reference, reference));
    } else {
      const { completeHackathonPaymentByReference } = await import(
        "@/lib/hackathon/service"
      );
      await completeHackathonPaymentByReference({
        reference,
        status: txStatus === "FAILED" ? "FAILED" : "PROCESSING",
        providerTxId: providerTxId || null,
      });
    }
    await db
      .insert(freshpayWebhookEvents)
      .values({
        dedupKey,
        kind: "card_deposit",
        providerReference: reference,
        status: txStatus,
        currency,
        amount,
        userId: tx?.userId ?? null,
        effect: txStatus === "FAILED" ? "card_failed" : "card_non_final",
        rawBody,
      })
      .onConflictDoNothing();
    return { ok: true };
  }

  if (!tx || !UUID_RE.test(tx.userId) || tx.kind !== "deposit") {
    if (!tx) {
      const { completeHackathonPaymentByReference } = await import(
        "@/lib/hackathon/service"
      );
      const hackathon = await completeHackathonPaymentByReference({
        reference,
        status: "COMPLETED",
        providerTxId: providerTxId || null,
      });
      if (hackathon.handled) {
        if (hackathon.registrationId) {
          const { sendHackathonTicketEmail } = await import(
            "@/lib/email/messages/hackathon"
          );
          void sendHackathonTicketEmail({
            registrationId: hackathon.registrationId,
          }).catch(() => null);
        }
        await db
          .insert(freshpayWebhookEvents)
          .values({
            dedupKey,
            kind: "card_deposit",
            providerReference: reference,
            status: txStatus,
            currency,
            amount,
            userId: null,
            effect: "hackathon_paid",
            rawBody,
          })
          .onConflictDoNothing();
        return { ok: true };
      }
    }
    await db
      .insert(freshpayWebhookEvents)
      .values({
        dedupKey,
        kind: "card_deposit",
        providerReference: reference,
        status: txStatus,
        currency,
        amount,
        userId: tx?.userId ?? null,
        effect: "no_user",
        rawBody,
      })
      .onConflictDoNothing();
    return { ok: true };
  }

  const pocket = (currency || tx.currency).toUpperCase() === "USD" ? "USD" : "CDF";
  const gross = Number(amount || tx.amount);
  if (!Number.isFinite(gross) || gross <= 0) {
    return { ok: true };
  }

  const net = gross * (1 - FIAT_FEE_RATE);
  const fee = gross - net;
  const netStr = fmtWalletAmount(net);
  const feeUsdEq =
    pocket === "USD" ? fmtWalletAmount(fee) : fmtWalletAmount(fee / cdfPerOneUsd());

  try {
    await db.transaction(async (t) => {
      const [inserted] = await t
        .insert(freshpayWebhookEvents)
        .values({
          dedupKey,
          kind: "card_deposit",
          providerReference: reference,
          status: txStatus,
          currency: pocket,
          amount: String(gross),
          userId: tx.userId,
          effect: "credited_fiat",
          rawBody,
        })
        .onConflictDoNothing()
        .returning({ id: freshpayWebhookEvents.id });

      if (!inserted) return;

      await t
        .update(fiatFreshpayTransactions)
        .set({
          status: "COMPLETED",
          providerTxId: providerTxId || undefined,
          updatedAt: new Date(),
          completedAt: new Date(),
        })
        .where(eq(fiatFreshpayTransactions.reference, reference));

      const existing = await t
        .select({ id: walletLedgerEntries.id })
        .from(walletLedgerEntries)
        .where(
          and(
            eq(walletLedgerEntries.userId, tx.userId),
            eq(walletLedgerEntries.entryType, "fiat_deposit"),
            sql`(${walletLedgerEntries.meta} ->> 'fiatDepositRef') = ${reference}`,
          ),
        )
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
            fiatDepositRef: reference,
            rail: "card",
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
    currency: pocket,
    feeUsdEquivalentStr: feeUsdEq,
    fiatDepositRef: reference,
  });

  return { ok: true };
}
