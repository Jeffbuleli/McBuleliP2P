import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb } from "@/db";
import {
  freshpayVerifyBestEffort,
  mapFreshpayVerifyStatus,
} from "@/lib/freshpay/provider";
import { handleFreshpayCallbackPayload } from "@/lib/freshpay/handle-callback";
import type { FreshpayCallbackPayload } from "@/lib/freshpay/types";

type FiatTxRow = typeof fiatFreshpayTransactions.$inferSelect;

export async function refreshFiatTxFromProvider(tx: FiatTxRow): Promise<FiatTxRow> {
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
    const payload: FreshpayCallbackPayload = {
      Action: tx.kind === "deposit" ? "debit" : "credit",
      Reference: tx.reference,
      Trans_Status: mapped === "COMPLETED" ? "Successful" : "Failed",
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
