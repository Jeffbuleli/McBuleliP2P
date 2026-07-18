import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, hackathonPayments, hackathonRegistrations } from "@/db";
import {
  resolvePawapayProvider,
  toPawapayProviderId,
} from "@/lib/cod-mobile-providers";
import { hasPawapayKeys } from "@/lib/env";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import { formatPawapayAmount, pawapayPayIn } from "@/lib/pawapay/provider";
import type { HackathonPaymentMethod } from "@/lib/hackathon/constants";

function momoNetworkFromMethod(method: HackathonPaymentMethod): string {
  if (method === "orange") return "ORANGE_COD";
  if (method === "mpesa") return "VODACOM_MPESA_COD";
  if (method === "airtel") return "AIRTEL_COD";
  return "ORANGE_COD";
}

export async function initiateHackathonMomoPayment(args: {
  registrationId: string;
  amountUsd: string;
  phoneNumber: string;
  paymentMethod: "orange" | "mpesa" | "airtel";
}): Promise<
  | { ok: true; reference: string }
  | { ok: false; error: string; message?: string }
> {
  if (!hasPawapayKeys()) {
    return { ok: false, error: "payment_unconfigured" };
  }

  const phone = normalizeCodPhoneNumber(args.phoneNumber);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false, error: "invalid_phone" };
  }

  const amountNum = Number(args.amountUsd);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { ok: false, error: "invalid_amount" };
  }

  const amount = formatPawapayAmount(amountNum);
  const reference = randomUUID();
  const network = resolvePawapayProvider(phone, momoNetworkFromMethod(args.paymentMethod));
  const providerId = toPawapayProviderId(network.method);

  const db = getDb();
  await db.insert(hackathonPayments).values({
    registrationId: args.registrationId,
    reference,
    rail: "momo",
    provider: providerId,
    phoneNumber: phone,
    currency: "USD",
    amount,
    status: "INITIATED",
    meta: {
      paymentMethod: args.paymentMethod,
      networkDetected: network.detected,
      networkMatched: network.matched,
    },
  });

  const r = await pawapayPayIn({
    depositId: reference,
    amount,
    currency: "USD",
    phoneNumber: phone,
    provider: providerId,
  });

  if (!r.accepted) {
    const msg =
      r.response.failureReason?.failureMessage ??
      r.response.failureReason?.failureCode ??
      "payment_rejected";
    await db
      .update(hackathonPayments)
      .set({
        status: "FAILED",
        failureMessage: msg,
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(hackathonPayments.reference, reference));
    await db
      .update(hackathonRegistrations)
      .set({ paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(hackathonRegistrations.id, args.registrationId));
    return { ok: false, error: "payment_rejected", message: msg };
  }

  await db
    .update(hackathonPayments)
    .set({ status: "PROCESSING", updatedAt: new Date() })
    .where(eq(hackathonPayments.reference, reference));

  return { ok: true, reference };
}
