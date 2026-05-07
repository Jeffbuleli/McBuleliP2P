import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hasPawapayKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { executeFiatWithdraw } from "@/lib/wallet-fiat-withdraw";
import { pawapayInitiatePayout } from "@/lib/pawapay/client";
import { normalizeCodPhoneNumber } from "@/lib/pawapay/normalize-phone";
import { getDb } from "@/db";
import { walletLedgerEntries } from "@/db/schema";
import { creditUserAsset } from "@/lib/wallet-move-assets";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { sql } from "drizzle-orm";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6),
  provider: z.string().min(2),
});

async function refundIfNotYet(args: {
  userId: string;
  asset: "USD" | "CDF";
  batchId: string;
  grossAmountStr: string;
  pawapayPayoutId: string;
  reason: string;
}) {
  const db = getDb();
  const pocket = args.asset;
  const grossNum = Number(args.grossAmountStr);
  if (!Number.isFinite(grossNum) || grossNum <= 0) return;
  const grossStr = fmtWalletAmount(grossNum);

  await db.transaction(async (tx) => {
    // Avoid double-refunds if initiation failed but a later callback also fails.
    const rows = await tx
      .select({ id: walletLedgerEntries.id })
      .from(walletLedgerEntries)
      .where(
        sql`${walletLedgerEntries.batchId} = ${args.batchId}::uuid and ${walletLedgerEntries.entryType} = 'fiat_withdraw_refund' and (${walletLedgerEntries.meta} ->> 'pawapayPayoutId') = ${args.pawapayPayoutId}`,
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
          pawapayPayoutId: args.pawapayPayoutId,
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
  if (!hasPawapayKeys()) {
    return NextResponse.json({ error: "wallet_pawapay_unconfigured" }, { status: 503 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }
  const r = await executeFiatWithdraw({
    userId,
    asset: parsed.data.asset,
    grossAmountStr: parsed.data.grossAmount,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }

  const payoutId = randomUUID();
  try {
    const phone = normalizeCodPhoneNumber(parsed.data.phoneNumber);
    const pr = await pawapayInitiatePayout({
      payoutId,
      amount: r.net,
      currency: parsed.data.asset,
      recipient: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone,
          provider: parsed.data.provider.trim(),
        },
      },
      metadata: {
        userId,
        batchId: r.batchId,
      },
    });

    if (pr.status !== "ACCEPTED" && pr.status !== "DUPLICATE_IGNORED") {
      const code = pr.failureReason?.failureCode?.trim() || null;
      const msg = pr.failureReason?.failureMessage?.trim() || null;
      // Refund immediately; initiation was rejected so no payout should proceed.
      await refundIfNotYet({
        userId,
        asset: parsed.data.asset,
        batchId: r.batchId,
        grossAmountStr: parsed.data.grossAmount,
        pawapayPayoutId: payoutId,
        reason: "initiation_rejected",
      });
      return NextResponse.json(
        {
          ok: false,
          error: "wallet_pawapay_payout_rejected",
          failureReason: pr.failureReason ?? null,
          detail: code && msg ? `${code}: ${msg}` : msg ?? code,
        },
        { status: 400 },
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    // Refund immediately; initiation failed (network/server). Safe fallback.
    await refundIfNotYet({
      userId,
      asset: parsed.data.asset,
      batchId: r.batchId,
      grossAmountStr: parsed.data.grossAmount,
      pawapayPayoutId: payoutId,
      reason: "initiation_failed",
    });
    return NextResponse.json(
      { ok: false, error: "wallet_pawapay_payout_failed", detail: msg },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    batchId: r.batchId,
    net: r.net,
    fee: r.fee,
  });
}
