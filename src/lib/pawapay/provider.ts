import {
  getPawapayApiBaseUrl,
  getPawapayApiToken,
} from "@/lib/env";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import { toPawapayProviderId } from "@/lib/cod-mobile-providers";
import type {
  PawapayFinalStatus,
  PawapayInitResponse,
  PawapayNormalizedCallback,
  PawapayStatusResponse,
} from "@/lib/pawapay/types";
import {
  assertPawapayCallbackIp,
  assertPawapayCallbackSecret,
} from "@/lib/pawapay/callback-security";

/**
 * PawaPay amount rules: no trailing zeros after decimal; leading zero only for < 1.
 * Pattern roughly: ^([0]|([1-9][0-9]{0,17}))([.][0-9]{0,3}[1-9])?$
 */
export function formatPawapayAmount(amount: string | number): string {
  const n = typeof amount === "number" ? amount : Number(String(amount).trim());
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("invalid_amount");
  }
  if (n === 0) return "0";
  let s = n.toFixed(3);
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}

export function formatPawapayPhone(input: string): string {
  return normalizeCodPhoneNumber(input);
}

export function isPawapayInitAccepted(status: string | undefined): boolean {
  const s = String(status ?? "").toUpperCase();
  return s === "ACCEPTED" || s === "DUPLICATE_IGNORED";
}

export function mapPawapayStatus(status: string | undefined): "COMPLETED" | "FAILED" | "PROCESSING" {
  const s = String(status ?? "").toUpperCase();
  if (s === "COMPLETED") return "COMPLETED";
  if (s === "FAILED" || s === "REJECTED") return "FAILED";
  return "PROCESSING";
}

async function pawapayFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const base = getPawapayApiBaseUrl().replace(/\/+$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${getPawapayApiToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`pawapay_invalid_json:${res.status}`);
  }

  if (!res.ok && (!json || typeof json !== "object")) {
    throw new Error(`pawapay_http_${res.status}`);
  }

  return json as T;
}

export type PawapayPayInArgs = {
  depositId: string;
  amount: string;
  currency: "USD" | "CDF";
  phoneNumber: string;
  provider: string;
  customerMessage?: string;
};

export type PawapayPayOutArgs = {
  payoutId: string;
  amount: string;
  currency: "USD" | "CDF";
  phoneNumber: string;
  provider: string;
  customerMessage?: string;
};

function mmoAccount(phoneNumber: string, provider: string) {
  return {
    type: "MMO" as const,
    accountDetails: {
      phoneNumber: formatPawapayPhone(phoneNumber),
      provider: toPawapayProviderId(provider),
    },
  };
}

/** C2B — request payment from customer (deposit). */
export async function pawapayPayIn(args: PawapayPayInArgs): Promise<{
  accepted: boolean;
  response: PawapayInitResponse;
}> {
  const response = await pawapayFetch<PawapayInitResponse>("POST", "/v2/deposits", {
    depositId: args.depositId,
    amount: formatPawapayAmount(args.amount),
    currency: args.currency,
    payer: mmoAccount(args.phoneNumber, args.provider),
    ...(args.customerMessage
      ? { customerMessage: args.customerMessage.slice(0, 22) }
      : { customerMessage: "McBuleli deposit" }),
  });
  return { accepted: isPawapayInitAccepted(response.status), response };
}

/** B2C — send funds to customer (withdrawal). */
export async function pawapayPayOut(args: PawapayPayOutArgs): Promise<{
  accepted: boolean;
  response: PawapayInitResponse;
}> {
  const response = await pawapayFetch<PawapayInitResponse>("POST", "/v2/payouts", {
    payoutId: args.payoutId,
    amount: formatPawapayAmount(args.amount),
    currency: args.currency,
    recipient: mmoAccount(args.phoneNumber, args.provider),
    ...(args.customerMessage
      ? { customerMessage: args.customerMessage.slice(0, 22) }
      : { customerMessage: "McBuleli withdraw" }),
  });
  return { accepted: isPawapayInitAccepted(response.status), response };
}

export async function pawapayCheckDeposit(depositId: string): Promise<PawapayStatusResponse | null> {
  try {
    return await pawapayFetch<PawapayStatusResponse>("GET", `/v2/deposits/${depositId}`);
  } catch {
    return null;
  }
}

export async function pawapayCheckPayout(payoutId: string): Promise<PawapayStatusResponse | null> {
  try {
    return await pawapayFetch<PawapayStatusResponse>("GET", `/v2/payouts/${payoutId}`);
  } catch {
    return null;
  }
}

function failureFromUnknown(raw: Record<string, unknown>): {
  failureCode: string | null;
  failureMessage: string | null;
} {
  const fr = raw.failureReason;
  if (fr && typeof fr === "object") {
    const o = fr as Record<string, unknown>;
    return {
      failureCode: o.failureCode != null ? String(o.failureCode) : null,
      failureMessage: o.failureMessage != null ? String(o.failureMessage) : null,
    };
  }
  return { failureCode: null, failureMessage: null };
}

export function normalizePawapayStatusPayload(
  kind: "deposit" | "payout",
  remote: PawapayStatusResponse,
  fallback: { reference: string; currency: string; amount: string },
): PawapayNormalizedCallback {
  const reference =
    (kind === "deposit" ? remote.depositId : remote.payoutId)?.trim() || fallback.reference;
  const fail = failureFromUnknown(remote as unknown as Record<string, unknown>);
  return {
    kind,
    reference,
    status: mapPawapayStatus(remote.status as PawapayFinalStatus),
    currency: String(remote.currency ?? fallback.currency).toUpperCase(),
    amount: String(remote.amount ?? fallback.amount),
    providerTxId: remote.providerTransactionId?.trim() || null,
    failureCode: fail.failureCode,
    failureMessage: fail.failureMessage,
    rawBody: JSON.stringify(remote),
  };
}

/**
 * Parse deposit or payout callback JSON.
 * PawaPay configures callback URLs in the dashboard (not per-request).
 */
export function parsePawapayCallback(
  req: Request,
  body: Record<string, unknown>,
): PawapayNormalizedCallback {
  assertPawapayCallbackIp(req);
  assertPawapayCallbackSecret(req);

  const depositId = body.depositId != null ? String(body.depositId).trim() : "";
  const payoutId = body.payoutId != null ? String(body.payoutId).trim() : "";
  const kind: "deposit" | "payout" | null = depositId
    ? "deposit"
    : payoutId
      ? "payout"
      : null;
  if (!kind) {
    throw new Error("missing_payment_id");
  }

  const reference = kind === "deposit" ? depositId : payoutId;
  const fail = failureFromUnknown(body);
  return {
    kind,
    reference,
    status: mapPawapayStatus(body.status != null ? String(body.status) : undefined),
    currency: String(body.currency ?? "").toUpperCase(),
    amount: String(body.amount ?? ""),
    providerTxId:
      body.providerTransactionId != null ? String(body.providerTransactionId).trim() : null,
    failureCode: fail.failureCode,
    failureMessage: fail.failureMessage,
    rawBody: JSON.stringify(body),
  };
}

export const PawaPayProvider = {
  payIn: pawapayPayIn,
  payOut: pawapayPayOut,
  checkDeposit: pawapayCheckDeposit,
  checkPayout: pawapayCheckPayout,
  parseCallback: parsePawapayCallback,
  mapStatus: mapPawapayStatus,
};
