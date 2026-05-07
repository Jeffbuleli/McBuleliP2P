import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { fiatPawapayTransactions, getDb, pawapayWebhookEvents, walletLedgerEntries } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayFetchDepositStatus, pawapayFetchPayoutStatus } from "@/lib/pawapay/client";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { randomUUID } from "node:crypto";
import { cdfPerOneUsd } from "@/lib/fx";

const paramsZ = z.object({
  id: z.string().uuid(),
});

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
    .from(fiatPawapayTransactions)
    .where(eq(fiatPawapayTransactions.pawapayId, parsed.data.id));

  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // On refresh, we do two things:
  // 1) Update tx status from PawaPay when still pending.
  // 2) Reconcile wallet credit if PawaPay is COMPLETED but our webhook/credit was missed.
  const shouldUpdateRemoteStatus =
    refresh && hasPawapayKeys() && (tx.status === "PROCESSING" || tx.status === "INITIATED");
  const shouldReconcileDepositCredit = refresh && tx.kind === "deposit";

  if (shouldUpdateRemoteStatus || shouldReconcileDepositCredit) {
    try {
      if (tx.kind === "deposit") {
        const s = hasPawapayKeys() ? await pawapayFetchDepositStatus(tx.pawapayId) : null;
        const status = s?.status ?? (tx.status === "COMPLETED" ? "COMPLETED" : null);

        if (shouldUpdateRemoteStatus && s) {
          await db
            .update(fiatPawapayTransactions)
            .set({
              status: s.status === "COMPLETED" ? "COMPLETED" : s.status === "FAILED" ? "FAILED" : "PROCESSING",
              failureCode: s.failureReason?.failureCode ?? null,
              failureMessage: s.failureReason?.failureMessage ?? null,
              updatedAt: new Date(),
              completedAt: s.status === "COMPLETED" || s.status === "FAILED" ? new Date() : null,
            })
            .where(eq(fiatPawapayTransactions.pawapayId, tx.pawapayId));
        }

        // Reconcile credit if webhook was missed/delayed (even if tx already marked COMPLETED).
        if (status === "COMPLETED") {
          const currency = (tx.currency ?? "").toUpperCase();
          const pocket = currency === "USD" ? "USD" : "CDF";
          const gross = Number(s?.amount ?? tx.amount);
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
                    sql`${walletLedgerEntries.meta} ->> 'pawapayDepositId' = ${tx.pawapayId}`,
                  ),
                )
                .limit(1);
              if (existing.length > 0) return;

              const dedupKey = `deposit:${tx.pawapayId}:COMPLETED:reconcile`;
              await t
                .insert(pawapayWebhookEvents)
                .values({
                  dedupKey,
                  kind: "deposit",
                  pawapayId: tx.pawapayId,
                  status: "COMPLETED",
                  currency,
                  amount: String(s?.amount ?? tx.amount),
                  userId,
                  effect: "credited_fiat",
                  rawBody: JSON.stringify({ source: "status_refresh", status: s ?? null }),
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
                    gross: String(s?.amount ?? tx.amount),
                    feeRate: FIAT_FEE_RATE,
                    fee: fmtWalletAmount(fee),
                    pawapayDepositId: tx.pawapayId,
                    source: "status_refresh",
                  },
                },
              ]);
            });
          }
        }
      } else if (shouldUpdateRemoteStatus && tx.kind === "payout") {
        const s = await pawapayFetchPayoutStatus(tx.pawapayId);
        if (s) {
          await db
            .update(fiatPawapayTransactions)
            .set({
              status: s.status === "COMPLETED" ? "COMPLETED" : s.status === "FAILED" ? "FAILED" : "PROCESSING",
              failureCode: s.failureReason?.failureCode ?? null,
              failureMessage: s.failureReason?.failureMessage ?? null,
              updatedAt: new Date(),
              completedAt: s.status === "COMPLETED" || s.status === "FAILED" ? new Date() : null,
            })
            .where(eq(fiatPawapayTransactions.pawapayId, tx.pawapayId));
        }
      }
    } catch {
      // best-effort refresh
    }
  }

  const [fresh] = await db
    .select()
    .from(fiatPawapayTransactions)
    .where(eq(fiatPawapayTransactions.pawapayId, parsed.data.id));

  return NextResponse.json({
    ok: true,
    tx: fresh,
  });
}

