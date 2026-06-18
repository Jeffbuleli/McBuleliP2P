import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasFreshpayKeys } from "@/lib/env";
import { freshpayPayIn } from "@/lib/freshpay/provider";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import {
  isFreshpaySupportedCurrency,
  isFreshpaySupportedForCountry,
} from "@/lib/freshpay/availability";
import { checkKycGate } from "@/lib/kyc-guard";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6),
  provider: z.string().min(2),
  providerLabel: z.string().min(1).optional(),
});

function userIdentity(u: {
  email: string;
  legalFirstName: string | null;
  legalLastName: string | null;
  displayName: string | null;
}) {
  const first = u.legalFirstName?.trim() || u.displayName?.trim() || "McBuleli";
  const last = u.legalLastName?.trim() || "User";
  return { firstname: first, lastname: last, email: u.email };
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

  const { asset, grossAmount, phoneNumber, provider, providerLabel } = parsed.data;
  if (!isFreshpaySupportedCurrency(asset)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({
      countryCode: users.countryCode,
      email: users.email,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u || !isFreshpaySupportedForCountry(u.countryCode ?? null)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const reference = randomUUID();
  const identity = userIdentity(u);

  try {
    const phone = normalizeCodPhoneNumber(phoneNumber);
    const r = await freshpayPayIn({
      reference,
      amount: grossAmount,
      currency: asset,
      customerNumber: phone,
      method: provider,
      ...identity,
    });

    if (!r.accepted) {
      const msg = r.response.Comment ?? r.response.resultCodeErrorDescription ?? null;
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
            provider: provider.trim(),
            failureMessage: msg,
            meta: { providerLabel: providerLabel ?? null, initiation: r.response },
          })
          .onConflictDoNothing();
      } catch {
        // best-effort
      }
      return NextResponse.json(
        {
          ok: false,
          error: "wallet_fiat_deposit_rejected",
          detail: msg,
        },
        { status: 400 },
      );
    }

    await db
      .insert(fiatFreshpayTransactions)
      .values({
        userId,
        kind: "deposit",
        status: "PROCESSING",
        reference,
        providerTxId: r.response.Transaction_id ?? null,
        currency: asset,
        amount: grossAmount,
        phoneNumber: phone,
        provider: provider.trim(),
        meta: { providerLabel: providerLabel ?? null, initiation: r.response },
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, depositId: reference, status: "PROCESSING" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    return NextResponse.json(
      { ok: false, error: "wallet_fiat_deposit_failed", detail: msg },
      { status: 502 },
    );
  }
}
