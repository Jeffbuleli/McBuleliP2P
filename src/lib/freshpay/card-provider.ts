import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  getFreshpayCardApiBaseUrl,
  getFreshpayCardApiKey,
  getFreshpayCardApiSecret,
  getFreshpayCardCallbackSecret,
} from "@/lib/env";

export type CardOrderResponse = {
  status?: string;
  data?: {
    transaction_uuid?: string;
    merchant_reference?: string;
    links?: string;
    amount?: number;
    currency?: string;
    message?: string;
  };
  error?: { message?: string; code?: string };
};

function signCardPayload(payload: Record<string, unknown>, timestamp: string): string {
  const secret = getFreshpayCardApiSecret();
  const body = JSON.stringify(payload) + timestamp;
  return createHmac("sha256", secret).update(body).digest("hex");
}

export async function freshpayCreateCardOrder(args: {
  reference: string;
  amount: number;
  currency: "USD" | "CDF";
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
}): Promise<{ ok: true; checkoutUrl: string; transactionUuid: string } | { ok: false; message: string }> {
  const base = getFreshpayCardApiBaseUrl();
  const timestamp = new Date().toISOString();
  const payload = {
    amount: args.amount,
    currency: args.currency,
    merchant_reference: args.reference,
    bill_to_forename: args.firstname,
    bill_to_surname: args.lastname,
    bill_to_email: args.email,
    bill_to_phone: args.phone ?? "+243000000000",
    bill_to_address_line1: "Kinshasa",
    bill_to_address_city: "Kinshasa",
    bill_to_address_state: "KN",
    bill_to_address_postal_code: "00000",
    bill_to_address_country: "CD",
    callback_url: getAppAbsoluteUrl("/api/webhooks/freshpay/card"),
  };

  const signature = signCardPayload(payload, timestamp);
  const res = await fetch(`${base}/api/v1/payment/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": getFreshpayCardApiKey(),
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body: JSON.stringify(payload),
  });

  const json = (await res.json().catch(() => ({}))) as CardOrderResponse;
  if (!res.ok || json.status !== "success" || !json.data?.links) {
    const msg = json.error?.message ?? json.data?.message ?? `HTTP ${res.status}`;
    return { ok: false, message: msg };
  }

  return {
    ok: true,
    checkoutUrl: String(json.data.links),
    transactionUuid: String(json.data.transaction_uuid ?? args.reference),
  };
}

export function verifyCardCallbackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", getFreshpayCardCallbackSecret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
