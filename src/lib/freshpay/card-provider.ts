import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  getFreshpayCardApiBaseUrl,
  getFreshpayCardApiKey,
  getFreshpayCardApiSecret,
  getFreshpayCardCallbackSecret,
} from "@/lib/env";
import { formatCardBillToPhone } from "@/lib/freshpay/normalize-phone";

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
  error?: {
    message?: string;
    code?: string;
    details?: { field?: string; issue?: string } | string;
  };
};

export function formatCardOrderAmount(amount: number, currency: "USD" | "CDF"): number {
  if (!Number.isFinite(amount) || amount <= 0) return amount;
  if (currency === "CDF") return Math.round(amount);
  return Math.round(amount * 100) / 100;
}

function cardApiErrorMessage(json: CardOrderResponse, status: number): string {
  const details = json.error?.details;
  if (details && typeof details === "object") {
    const field = details.field?.trim();
    const issue = details.issue?.trim();
    if (field && issue) return `${field}: ${issue}`;
    if (issue) return issue;
  }
  if (typeof details === "string" && details.trim()) return details.trim();
  const code = json.error?.code?.trim();
  const message = json.error?.message ?? json.data?.message;
  if (code && message) return `${code}: ${message}`;
  return message ?? `HTTP ${status}`;
}

function signCardPayload(body: string, timestamp: string): string {
  const secret = getFreshpayCardApiSecret();
  return createHmac("sha256", secret).update(body + timestamp).digest("hex");
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
  const amount = formatCardOrderAmount(args.amount, args.currency);
  const billPhone = formatCardBillToPhone(args.phone);
  if (!billPhone) {
    return { ok: false, message: "bill_to_phone: Invalid phone number format" };
  }

  const payload = {
    amount,
    currency: args.currency,
    merchant_reference: args.reference,
    bill_to_forename: args.firstname,
    bill_to_surname: args.lastname,
    bill_to_email: args.email,
    bill_to_phone: billPhone,
    bill_to_address_line1: "Kinshasa",
    bill_to_address_city: "Kinshasa",
    bill_to_address_state: "KN",
    bill_to_address_postal_code: "00000",
    bill_to_address_country: "CD",
    callback_url: getAppAbsoluteUrl("/api/webhooks/freshpay/card"),
    return_url: getAppAbsoluteUrl(`/app/wallet/fiat/status/${encodeURIComponent(args.reference)}?card=1`),
  };

  const body = JSON.stringify(payload);
  const signature = signCardPayload(body, timestamp);
  const res = await fetch(`${base}/api/v1/payment/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-API-Key": getFreshpayCardApiKey(),
      "X-Timestamp": timestamp,
      "X-Signature": signature,
    },
    body,
  });

  const json = (await res.json().catch(() => ({}))) as CardOrderResponse;
  if (!res.ok || json.status !== "success" || !json.data?.links) {
    const msg = cardApiErrorMessage(json, res.status);
    return { ok: false, message: msg };
  }

  return {
    ok: true,
    checkoutUrl: String(json.data.links),
    transactionUuid: String(json.data.transaction_uuid ?? args.reference),
  };
}

function cardAuthHeaders(payload: Record<string, unknown>): Record<string, string> {
  const timestamp = new Date().toISOString();
  const body = JSON.stringify(payload);
  const signature = signCardPayload(body, timestamp);
  return {
    Accept: "application/json",
    "X-API-Key": getFreshpayCardApiKey(),
    "X-Timestamp": timestamp,
    "X-Signature": signature,
  };
}

/** Poll card order status after hosted checkout return (best-effort). */
export async function freshpayFetchCardOrderStatus(args: {
  reference: string;
  transactionUuid?: string | null;
}): Promise<CardOrderResponse | null> {
  const base = getFreshpayCardApiBaseUrl().replace(/\/+$/, "");
  const payload = { merchant_reference: args.reference };
  const headers = cardAuthHeaders(payload);

  const candidates = [
    args.transactionUuid
      ? `${base}/api/v1/payment/orders/${encodeURIComponent(args.transactionUuid)}`
      : null,
    `${base}/api/v1/payment/orders?merchant_reference=${encodeURIComponent(args.reference)}`,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as CardOrderResponse;
      if (res.ok && json.status === "success" && json.data) return json;
    } catch {
      // try next endpoint shape
    }
  }
  return null;
}

export function verifyCardCallbackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader?.trim()) return false;
  const expected = createHmac("sha256", getFreshpayCardCallbackSecret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader.trim(), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
