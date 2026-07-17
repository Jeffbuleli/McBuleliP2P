import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayPayIn } from "@/lib/pawapay/provider";
import { resolvePawapayProvider, toPawapayProviderId } from "@/lib/cod-mobile-providers";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import {
  isPawapaySupportedCurrency,
  isPawapaySupportedForCountry,
} from "@/lib/pawapay/availability";
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
    return NextResponse.json({ error: "wallet_fiat_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const { asset, grossAmount, phoneNumber, provider, providerLabel } = parsed.data;
  if (!isPawapaySupportedCurrency(asset)) {
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

  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const reference = randomUUID();

  try {
    const phone = normalizeCodPhoneNumber(phoneNumber);
    const network = resolvePawapayProvider(phone, provider);
    const providerId = toPawapayProviderId(network.method);
    const r = await pawapayPayIn({
      depositId: reference,
      amount: grossAmount,
      currency: asset,
      phoneNumber: phone,
      provider: providerId,
    });

    if (!r.accepted) {
      const msg =
        r.response.failureReason?.failureMessage ??
        r.response.failureReason?.failureCode ??
        null;
      try {
        await db
          .insert(fiatFreshpayTransactions)
          .values({
            userId,
            kind: "deposit",
            status: "FAILED",
            reference,
            currency: asset,
            amount: grossAmount,
            phoneNumber: phone,
            provider: providerId,
            failureCode: r.response.failureReason?.failureCode ?? null,
            failureMessage: msg,
            meta: {
              rail: "pawapay",
              providerLabel: providerLabel ?? null,
              selectedProvider: provider.trim(),
              networkDetected: network.detected,
              networkMatched: network.matched,
            },
          })
          .onConflictDoNothing();
      } catch {
        // best-effort
      }
      logFiatApiError("momo.deposit", msg);
      return NextResponse.json({ ok: false, error: "wallet_fiat_deposit_rejected" }, { status: 400 });
    }

    await db
      .insert(fiatFreshpayTransactions)
      .values({
        userId,
        kind: "deposit",
        status: "PROCESSING",
        reference,
        currency: asset,
        amount: grossAmount,
        phoneNumber: phone,
        provider: providerId,
        meta: {
          rail: "pawapay",
          providerLabel: providerLabel ?? null,
          selectedProvider: provider.trim(),
          networkDetected: network.detected,
          networkMatched: network.matched,
        },
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, depositId: reference, status: "PROCESSING" });
  } catch (e) {
    logFiatApiError("momo.deposit", e instanceof Error ? e.message : null);
    return NextResponse.json({ ok: false, error: "wallet_fiat_deposit_failed" }, { status: 502 });
  }
}
