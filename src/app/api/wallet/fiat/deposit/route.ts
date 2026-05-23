import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayInitiateDeposit } from "@/lib/pawapay/client";
import { normalizeCodPhoneNumber } from "@/lib/pawapay/normalize-phone";
import { getDb, fiatPawapayTransactions, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  isPawapaySupportedCurrency,
  isPawapaySupportedForCountry,
} from "@/lib/pawapay/availability";
import { checkKycGate } from "@/lib/kyc-guard";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6),
  provider: z.string().min(2),
  providerLabel: z.string().min(1).optional(),
});

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
  if (!hasPawapayKeys()) {
    return NextResponse.json({ error: "wallet_pawapay_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const { asset, grossAmount, phoneNumber, provider, providerLabel } = parsed.data;
  if (!isPawapaySupportedCurrency(asset)) {
    return NextResponse.json({ error: "wallet_pawapay_unavailable" }, { status: 400 });
  }
  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!isPawapaySupportedForCountry(u?.countryCode ?? null)) {
    return NextResponse.json({ error: "wallet_pawapay_unavailable" }, { status: 400 });
  }
  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const depositId = randomUUID();

  try {
    const phone = normalizeCodPhoneNumber(phoneNumber);
    const r = await pawapayInitiateDeposit({
      depositId,
      amount: grossAmount,
      currency: asset,
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone,
          provider: provider.trim(),
        },
      },
      metadata: {
        userId,
      },
    });

    if (r.status !== "ACCEPTED" && r.status !== "DUPLICATE_IGNORED") {
      const code = r.failureReason?.failureCode?.trim() || null;
      const msg = r.failureReason?.failureMessage?.trim() || null;
      // Record rejected attempt for UX / debugging.
      try {
        await db
          .insert(fiatPawapayTransactions)
          .values({
            userId,
            kind: "deposit",
            status: "FAILED",
            pawapayId: depositId,
            currency: asset,
            amount: grossAmount,
            phoneNumber: phone,
            provider: provider.trim(),
            failureCode: code,
            failureMessage: msg,
            meta: { initiationStatus: r.status, providerLabel: providerLabel ?? null },
          })
          .onConflictDoNothing();
      } catch {
        // best-effort
      }
      return NextResponse.json(
        {
          ok: false,
          error: "wallet_pawapay_deposit_rejected",
          failureReason: r.failureReason ?? null,
          detail: code && msg ? `${code}: ${msg}` : msg ?? code,
        },
        { status: 400 },
      );
    }

    // Record pending tx for UI.
    await db
      .insert(fiatPawapayTransactions)
      .values({
        userId,
        kind: "deposit",
        status: "PROCESSING",
        pawapayId: depositId,
        currency: asset,
        amount: grossAmount,
        phoneNumber: phone,
        provider: provider.trim(),
        meta: { initiationStatus: r.status, providerLabel: providerLabel ?? null },
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, depositId, status: r.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    return NextResponse.json(
      { ok: false, error: "wallet_pawapay_deposit_failed", detail: msg },
      { status: 502 },
    );
  }
}

