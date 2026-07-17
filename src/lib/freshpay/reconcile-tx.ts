import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb } from "@/db";
import {
  pawapayCheckDeposit,
  pawapayCheckPayout,
  normalizePawapayStatusPayload,
} from "@/lib/pawapay/provider";
import { handlePawapayCallback } from "@/lib/pawapay/handle-callback";
import { freshpayFetchCardOrderStatus } from "@/lib/freshpay/card-provider";
import { handleFreshpayCardCallback } from "@/lib/freshpay/handle-card-callback";

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
  const remote =
    tx.kind === "deposit"
      ? await pawapayCheckDeposit(tx.reference)
      : await pawapayCheckPayout(tx.reference);

  if (!remote) return tx;

  const normalized = normalizePawapayStatusPayload(
    tx.kind === "deposit" ? "deposit" : "payout",
    remote,
    { reference: tx.reference, currency: tx.currency, amount: tx.amount },
  );

  if (normalized.status !== "PROCESSING") {
    await handlePawapayCallback(normalized).catch(() => null);
  }

  const db = getDb();
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
