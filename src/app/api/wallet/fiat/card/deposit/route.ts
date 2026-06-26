import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasFreshpayCardKeys } from "@/lib/env";
import { freshpayCreateCardOrder, formatCardOrderAmount } from "@/lib/freshpay/card-provider";
import { formatCardBillToPhone } from "@/lib/freshpay/normalize-phone";
import {
  isFreshpaySupportedCurrency,
  isFreshpaySupportedForCountry,
} from "@/lib/freshpay/availability";
import { checkKycGate } from "@/lib/kyc-guard";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import { logFiatApiError } from "@/lib/fiat-api-errors";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6).optional(),
});

function userIdentity(u: {
  email: string;
  legalFirstName: string | null;
  legalLastName: string | null;
  displayName: string | null;
  phone: string | null;
}) {
  const first = u.legalFirstName?.trim() || u.displayName?.trim() || "McBuleli";
  const last = u.legalLastName?.trim() || "User";
  return { firstname: first, lastname: last, email: u.email, phone: u.phone ?? undefined };
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
  if (!hasFreshpayCardKeys()) {
    return NextResponse.json({ error: "wallet_fiat_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const { asset, grossAmount, phoneNumber } = parsed.data;
  if (!isFreshpaySupportedCurrency(asset)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const gross = formatCardOrderAmount(Number(grossAmount), asset);
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({
      countryCode: users.countryCode,
      email: users.email,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      displayName: users.displayName,
      phone: users.recoveryWaPhone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u || !isFreshpaySupportedForCountry(u.countryCode ?? null)) {
    return NextResponse.json({ error: "wallet_fiat_unavailable" }, { status: 400 });
  }

  const billPhone = formatCardBillToPhone(phoneNumber?.trim() || u.phone);
  if (!billPhone) {
    return NextResponse.json({ error: "wallet_fiat_invalid_phone" }, { status: 400 });
  }

  const reference = randomUUID();
  const identity = userIdentity(u);

  try {
    const r = await freshpayCreateCardOrder({
      reference,
      amount: gross,
      currency: asset,
      ...identity,
      phone: billPhone,
    });

    if (!r.ok) {
      logFiatApiError("card.deposit", r.message);
      try {
        await db
          .insert(fiatFreshpayTransactions)
          .values({
            userId,
            kind: "deposit",
            status: "FAILED",
            reference,
            currency: asset,
            amount: String(gross),
            provider: "card",
            failureMessage: r.message,
            meta: { rail: "card", providerLabel: "Card" },
          })
          .onConflictDoNothing();
      } catch {
        // best-effort
      }
      return NextResponse.json({ ok: false, error: "wallet_fiat_deposit_rejected" }, { status: 400 });
    }

    await db
      .insert(fiatFreshpayTransactions)
      .values({
        userId,
        kind: "deposit",
        status: "PROCESSING",
        reference,
        providerTxId: r.transactionUuid,
        currency: asset,
        amount: String(gross),
        provider: "card",
        meta: {
          rail: "card",
          providerLabel: "Card",
          checkoutUrl: r.checkoutUrl,
        },
      })
      .onConflictDoNothing();

    return NextResponse.json({
      ok: true,
      depositId: reference,
      checkoutUrl: r.checkoutUrl,
      status: "PROCESSING",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    logFiatApiError("card.deposit", msg);
    return NextResponse.json({ ok: false, error: "wallet_fiat_deposit_failed" }, { status: 502 });
  }
}
