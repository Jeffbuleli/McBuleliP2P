import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, users, walletLedgerEntries } from "@/db";
import { hasPawapayKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { executeFiatWithdraw } from "@/lib/wallet-fiat-withdraw";
import { pawapayPayOut } from "@/lib/pawapay/provider";
import { resolvePawapayProvider, toPawapayProviderId } from "@/lib/cod-mobile-providers";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import {
  isPawapaySupportedCurrency,
  isPawapaySupportedForCountry,
} from "@/lib/pawapay/availability";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { checkKycGate } from "@/lib/kyc-guard";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import { logFiatApiError } from "@/lib/fiat-api-errors";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { recordFinancialAudit } from "@/lib/financial-audit";

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
          pawapayPayoutId: args.fiatPayoutRef,
          reason: args.reason,
          rail: "pawapay",
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
  const limited = enforceApiRateLimit("fiat_withdraw", userId, req);
  if (limited) return limited;
  if (isFiatDepositWithdrawPaused()) {
    return NextResponse.json({ error: "wallet_fiat_paused" }, { status: 503 });
  }
  const kyc = await checkKycGate(userId, "deposit_fiat");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }
  if (!hasPawapayKeys()) {
    return NextResponse.json({ error: "wallet_fiat_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }
  if (!isPawapaySupportedCurrency(parsed.data.asset)) {
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

  if (!u || !isPawapaySupportedForCountry(u.countryCode ?? null)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const providerLabel = parsed.data.providerLabel?.trim() || null;
  const phone = normalizeCodPhoneNumber(parsed.data.phoneNumber);
  if (!isValidCodMsisdn(phone)) {
    return NextResponse.json({ error: "wallet_fiat_invalid_phone" }, { status: 400 });
  }

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
    const network = resolvePawapayProvider(phone, parsed.data.provider);
    const providerId = toPawapayProviderId(network.method);

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
          provider: providerId,
          batchId: r.batchId,
          meta: {
            rail: "pawapay",
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

    const pr = await pawapayPayOut({
      payoutId: reference,
      amount: r.net,
      currency: parsed.data.asset,
      phoneNumber: phone,
      provider: providerId,
    });

    if (!pr.accepted) {
      const msg =
        pr.response.failureReason?.failureMessage ??
        pr.response.failureReason?.failureCode ??
        null;
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
            failureCode: pr.response.failureReason?.failureCode ?? null,
            failureMessage: msg,
            updatedAt: new Date(),
          })
          .where(eq(fiatFreshpayTransactions.reference, reference));
      } catch {
        // best-effort
      }
      logFiatApiError("momo.withdraw", msg);
      const code = pr.response.failureReason?.failureCode ?? null;
      return NextResponse.json(
        {
          ok: false,
          error:
            code === "PAYOUTS_NOT_ALLOWED"
              ? "wallet_fiat_payouts_not_allowed"
              : "wallet_fiat_payout_rejected",
          failureCode: code,
        },
        { status: 400 },
      );
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

  recordFinancialAudit({
    userId,
    action: "fiat_withdraw_create",
    req,
    resourceType: "fiat_payout",
    resourceId: reference,
    asset: parsed.data.asset,
    amount: parsed.data.grossAmount,
    meta: { batchId: r.batchId, provider: parsed.data.provider, rail: "pawapay" },
  });

  return NextResponse.json({
    ok: true,
    payoutId: reference,
    batchId: r.batchId,
    net: r.net,
    fee: r.fee,
  });
}
