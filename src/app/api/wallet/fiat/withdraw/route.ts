import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, users, walletLedgerEntries } from "@/db";
import { hasFreshpayKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { executeFiatWithdraw } from "@/lib/wallet-fiat-withdraw";
import { freshpayPayOut } from "@/lib/freshpay/provider";
import { resolveFreshpayMethod } from "@/lib/cod-mobile-providers";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import {
  isFreshpaySupportedCurrency,
  isFreshpaySupportedForCountry,
} from "@/lib/freshpay/availability";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { checkKycGate } from "@/lib/kyc-guard";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import { logFiatApiError } from "@/lib/fiat-api-errors";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6),
  provider: z.string().min(2),
  providerLabel: z.string().min(1).optional(),
});

async function refundIfNotYet(args: {
  userId: string;
  asset: "USD" | "CDF";
  batchId: string;
  grossAmountStr: string;
  fiatPayoutRef: string;
  reason: string;
}) {
  const db = getDb();
  const pocket = args.asset;
  const grossNum = Number(args.grossAmountStr);
  if (!Number.isFinite(grossNum) || grossNum <= 0) return;
  const grossStr = fmtWalletAmount(grossNum);

  await db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: walletLedgerEntries.id })
      .from(walletLedgerEntries)
      .where(
        sql`${walletLedgerEntries.batchId} = ${args.batchId}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw_refund' and ((${walletLedgerEntries.meta} ->> 'fiatPayoutRef') = ${args.fiatPayoutRef} or (${walletLedgerEntries.meta} ->> 'pawapayPayoutId') = ${args.fiatPayoutRef})`,
      )
      .limit(1);
    if (rows.length > 0) return;

    await creditUserAsset(tx, args.userId, pocket, grossStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId: args.batchId,
        userId: args.userId,
        entryType: "fiat_withdraw_refund",
        asset: pocket,
        amount: grossStr,
        feeUsdEquivalent: "0",
        meta: {
          fiatPayoutRef: args.fiatPayoutRef,
          reason: args.reason,
        },
      },
    ]);
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isFiatDepositWithdrawPaused()) {
    return NextResponse.json({ error: "wallet_fiat_paused" }, { status: 503 });
  }
  const kyc = await checkKycGate(userId, "deposit_fiat");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }
  if (!hasFreshpayKeys()) {
    return NextResponse.json({ error: "wallet_fiat_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }
  if (!isFreshpaySupportedCurrency(parsed.data.asset)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({
      countryCode: users.countryCode,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u || !isFreshpaySupportedForCountry(u.countryCode ?? null)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const providerLabel = parsed.data.providerLabel?.trim() || null;
  const r = await executeFiatWithdraw({
    userId,
    asset: parsed.data.asset,
    grossAmountStr: parsed.data.grossAmount,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }

  const reference = randomUUID();

  try {
    const phone = normalizeCodPhoneNumber(parsed.data.phoneNumber);
    const network = resolveFreshpayMethod(phone, parsed.data.provider);

    try {
      await db
        .insert(fiatFreshpayTransactions)
        .values({
          userId,
          kind: "payout",
          status: "PROCESSING",
          reference,
          currency: parsed.data.asset,
          amount: r.net,
          phoneNumber: phone,
          provider: network.method,
          batchId: r.batchId,
          meta: {
            grossAmount: parsed.data.grossAmount,
            providerLabel,
            selectedProvider: parsed.data.provider.trim(),
            networkDetected: network.detected,
            networkMatched: network.matched,
          },
        })
        .onConflictDoNothing();
    } catch {
      // best-effort
    }

    const pr = await freshpayPayOut({
      reference,
      amount: r.net,
      currency: parsed.data.asset,
      customerNumber: phone,
      method: network.method,
    });

    if (!pr.accepted) {
      const msg = pr.response.Comment ?? pr.response.resultCodeErrorDescription ?? null;
      await refundIfNotYet({
        userId,
        asset: parsed.data.asset,
        batchId: r.batchId,
        grossAmountStr: parsed.data.grossAmount,
        fiatPayoutRef: reference,
        reason: "initiation_rejected",
      });
      try {
        await db
          .update(fiatFreshpayTransactions)
          .set({
            status: "FAILED",
            failureMessage: msg,
            updatedAt: new Date(),
          })
          .where(eq(fiatFreshpayTransactions.reference, reference));
      } catch {
        // best-effort
      }
      logFiatApiError("momo.withdraw", msg);
      return NextResponse.json({ ok: false, error: "wallet_fiat_payout_rejected" }, { status: 400 });
    }

    if (pr.response.Transaction_id) {
      await db
        .update(fiatFreshpayTransactions)
        .set({
          providerTxId: pr.response.Transaction_id,
          updatedAt: new Date(),
        })
        .where(eq(fiatFreshpayTransactions.reference, reference));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    await refundIfNotYet({
      userId,
      asset: parsed.data.asset,
      batchId: r.batchId,
      grossAmountStr: parsed.data.grossAmount,
      fiatPayoutRef: reference,
      reason: "initiation_failed",
    });
    try {
      await db
        .update(fiatFreshpayTransactions)
        .set({
          status: "FAILED",
          failureMessage: msg,
          updatedAt: new Date(),
        })
        .where(eq(fiatFreshpayTransactions.reference, reference));
    } catch {
      // best-effort
    }
    logFiatApiError("momo.withdraw", msg);
    return NextResponse.json({ ok: false, error: "wallet_fiat_payout_failed" }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    payoutId: reference,
    batchId: r.batchId,
    net: r.net,
    fee: r.fee,
  });
}
