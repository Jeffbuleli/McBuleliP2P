import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb } from "@/db";
import {
  freshpayVerifyBestEffort,
  mapFreshpayVerifyStatus,
} from "@/lib/freshpay/provider";
import { handleFreshpayCallbackPayload } from "@/lib/freshpay/handle-callback";
import { freshpayFetchCardOrderStatus } from "@/lib/freshpay/card-provider";
import { handleFreshpayCardCallback } from "@/lib/freshpay/handle-card-callback";
import type { FreshpayCallbackPayload } from "@/lib/freshpay/types";

type FiatTxRow = typeof fiatFreshpayTransactions.$inferSelect;

function isCardTx(tx: FiatTxRow): boolean {
  const meta = tx.meta ?? {};
  return tx.provider === "card" || meta.rail === "card";
}

async function refreshCardFiatTx(tx: FiatTxRow): Promise<FiatTxRow> {
  const remote = await freshpayFetchCardOrderStatus({
    reference: tx.reference,
    transactionUuid: tx.providerTxId,
  });
  if (!remote?.data) return tx;

  const payload = {
    merchant_reference: tx.reference,
    transaction_uuid: remote.data.transaction_uuid ?? tx.providerTxId ?? undefined,
    amount: remote.data.amount ?? Number(tx.amount),
    currency: remote.data.currency ?? tx.currency,
    payment_status: remote.data.message,
    status: remote.status,
    data: remote.data,
  };

  await handleFreshpayCardCallback(payload, JSON.stringify(remote)).catch(() => null);

  const db = getDb();
  const [fresh] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, tx.reference));
  return fresh ?? tx;
}

async function refreshMomoFiatTx(tx: FiatTxRow): Promise<FiatTxRow> {
  const db = getDb();
  const remote = await freshpayVerifyBestEffort({
    reference: tx.reference,
    providerTxId: tx.providerTxId,
  });
  const mapped = mapFreshpayVerifyStatus(remote);

  if (mapped && (tx.status === "PROCESSING" || tx.status === "INITIATED")) {
    await db
      .update(fiatFreshpayTransactions)
      .set({
        status:
          mapped === "COMPLETED" ? "COMPLETED" : mapped === "FAILED" ? "FAILED" : "PROCESSING",
        failureMessage:
          mapped === "FAILED"
            ? remote?.Trans_Status_Description ?? remote?.Status_Description ?? tx.failureMessage
            : null,
        providerTxId: remote?.Transaction_id?.trim() || tx.providerTxId,
        updatedAt: new Date(),
        completedAt: mapped === "COMPLETED" || mapped === "FAILED" ? new Date() : null,
      })
      .where(eq(fiatFreshpayTransactions.reference, tx.reference));
  }

  if (remote && mapped && mapped !== "PROCESSING") {
    const transStatus =
      String(remote.Trans_Status ?? "").trim() ||
      (mapped === "COMPLETED" ? "Successful" : "Failed");
    const payload: FreshpayCallbackPayload = {
      Action: tx.kind === "deposit" ? "debit" : "credit",
      Reference: tx.reference,
      Trans_Status: transStatus,
      Trans_Status_Description: remote.Trans_Status_Description ?? remote.Status_Description,
      Currency: remote.Currency ?? tx.currency,
      Amount: remote.Amount ?? Number(tx.amount),
      Transaction_id: remote.Transaction_id,
      PayDRC_Reference: remote.PayDRC_Reference,
    };
    await handleFreshpayCallbackPayload(payload).catch(() => null);
  }

  const [fresh] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, tx.reference));
  return fresh ?? tx;
}

export async function refreshFiatTxFromProvider(tx: FiatTxRow): Promise<FiatTxRow> {
  if (isCardTx(tx)) {
    return refreshCardFiatTx(tx);
  }
  return refreshMomoFiatTx(tx);
}
