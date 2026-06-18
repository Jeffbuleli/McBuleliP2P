import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  fiatFreshpayTransactions,
  freshpayWebhookEvents,
  getDb,
  walletLedgerEntries,
} from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasFreshpayKeys } from "@/lib/env";
import { freshpayVerify, mapFreshpayTransStatus } from "@/lib/freshpay/provider";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { cdfPerOneUsd } from "@/lib/fx";

const paramsZ = z.object({
  id: z.string().uuid(),
});

function depositLedgerRefSql(reference: string) {
  return sql`(${walletLedgerEntries.meta} ->> 'fiatDepositRef') = ${reference} or (${walletLedgerEntries.meta} ->> 'pawapayDepositId') = ${reference}`;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const parsed = paramsZ.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  const db = getDb();
  const [tx] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, parsed.data.id));

  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shouldUpdateRemoteStatus =
    refresh && hasFreshpayKeys() && (tx.status === "PROCESSING" || tx.status === "INITIATED");
  const shouldReconcileDepositCredit = refresh && tx.kind === "deposit";

  if (shouldUpdateRemoteStatus || shouldReconcileDepositCredit) {
    try {
      const verifyRef = tx.providerTxId?.trim() || tx.reference;
      const remote = hasFreshpayKeys() ? await freshpayVerify(verifyRef) : null;
      const mapped = remote ? mapFreshpayTransStatus(remote.Trans_Status) : null;

      if (shouldUpdateRemoteStatus && mapped) {
        await db
          .update(fiatFreshpayTransactions)
          .set({
            status:
              mapped === "COMPLETED"
                ? "COMPLETED"
                : mapped === "FAILED"
                  ? "FAILED"
                  : "PROCESSING",
            failureMessage:
              mapped === "FAILED" ? remote?.Trans_Status_Description ?? null : null,
            updatedAt: new Date(),
            completedAt: mapped === "COMPLETED" || mapped === "FAILED" ? new Date() : null,
          })
          .where(eq(fiatFreshpayTransactions.reference, tx.reference));
      }

      const status = mapped ?? (tx.status === "COMPLETED" ? "COMPLETED" : null);

      if (status === "COMPLETED" && tx.kind === "deposit") {
        const currency = (tx.currency ?? "").toUpperCase();
        const pocket = currency === "USD" ? "USD" : "CDF";
        const gross = Number(remote?.Amount ?? tx.amount);
        if (Number.isFinite(gross) && gross > 0) {
          const net = gross * (1 - FIAT_FEE_RATE);
          const fee = gross - net;
          const netStr = fmtWalletAmount(net);
          const feeUsdEq =
            pocket === "USD" ? fmtWalletAmount(fee) : fmtWalletAmount(fee / cdfPerOneUsd());

          await db.transaction(async (t) => {
            const existing = await t
              .select({ id: walletLedgerEntries.id })
              .from(walletLedgerEntries)
              .where(
                and(
                  eq(walletLedgerEntries.userId, userId),
                  eq(walletLedgerEntries.entryType, "fiat_deposit"),
                  depositLedgerRefSql(tx.reference),
                ),
              )
              .limit(1);
            if (existing.length > 0) return;

            const dedupKey = `deposit:${tx.reference}:COMPLETED:reconcile`;
            await t
              .insert(freshpayWebhookEvents)
              .values({
                dedupKey,
                kind: "deposit",
                providerReference: tx.reference,
                status: "COMPLETED",
                currency,
                amount: String(remote?.Amount ?? tx.amount),
                userId,
                effect: "credited_fiat",
                rawBody: JSON.stringify({ source: "status_refresh", remote }),
              })
              .onConflictDoNothing();

            await creditUserAsset(t, userId, pocket, netStr);
            await insertWalletLedgerLines(t, [
              {
                batchId: randomUUID(),
                userId,
                entryType: "fiat_deposit",
                asset: pocket,
                amount: netStr,
                feeUsdEquivalent: feeUsdEq,
                meta: {
                  gross: String(remote?.Amount ?? tx.amount),
                  feeRate: FIAT_FEE_RATE,
                  fee: fmtWalletAmount(fee),
                  fiatDepositRef: tx.reference,
                  source: "status_refresh",
                },
              },
            ]);
          });
        }
      }
    } catch {
      // best-effort refresh
    }
  }

  const [fresh] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, parsed.data.id));

  return NextResponse.json({
    ok: true,
    tx: fresh,
  });
}
