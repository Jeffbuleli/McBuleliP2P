import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  getFreshpayGatewayUrl,
  getFreshpayMerchantId,
  getFreshpayMerchantSecret,
} from "@/lib/env";
import { formatFreshpayCustomerNumber, normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import { toFreshpayMethod } from "@/lib/cod-mobile-providers";
import { FRESHPAY_MERCHANT_IDENTITY } from "@/lib/freshpay/merchant-identity";
import type {
  FreshpayCallbackPayload,
  FreshpayInitResponse,
  FreshpayVerifyResponse,
} from "@/lib/freshpay/types";
import {
  assertFreshpayCallbackIp,
  decryptFreshpayPayload,
  verifyFreshpaySignature,
} from "@/lib/freshpay/callback-security";

export function mapFreshpayTransStatus(
  transStatus: string | null | undefined,
): "COMPLETED" | "FAILED" | "PROCESSING" {
  const s = (transStatus ?? "").trim().toLowerCase();
  if (s === "successful" || s === "success") return "COMPLETED";
  if (s === "failed") return "FAILED";
  return "PROCESSING";
}

/** Map verify / callback payload to terminal status. */
export function mapFreshpayVerifyStatus(
  remote: FreshpayVerifyResponse | FreshpayInitResponse | null | undefined,
): "COMPLETED" | "FAILED" | "PROCESSING" | null {
  if (!remote) return null;
  const fromTrans = mapFreshpayTransStatus(
    "Trans_Status" in remote ? remote.Trans_Status : undefined,
  );
  if (fromTrans !== "PROCESSING") return fromTrans;
  const status = String(remote.Status ?? "").trim().toLowerCase();
  if (status === "success" || status === "successful") return "COMPLETED";
  if (status === "failed") return "FAILED";
  const desc = String(
    ("Trans_Status_Description" in remote ? remote.Trans_Status_Description : null) ??
      ("Status_Description" in remote ? remote.Status_Description : null) ??
      "",
  ).toLowerCase();
  if (desc.includes("fail")) return "FAILED";
  return fromTrans;
}

/** Try merchant reference first, then provider transaction id. */
export async function freshpayVerifyBestEffort(args: {
  reference: string;
  providerTxId?: string | null;
}): Promise<FreshpayVerifyResponse | null> {
  const refs = [args.reference.trim(), args.providerTxId?.trim()].filter(Boolean) as string[];
  const seen = new Set<string>();
  for (const ref of refs) {
    if (seen.has(ref)) continue;
    seen.add(ref);
    try {
      const remote = await freshpayVerify(ref);
      if (mapFreshpayVerifyStatus(remote)) return remote;
    } catch {
      // try next ref
    }
  }
  return null;
}

export function isFreshpayInitAccepted(body: FreshpayInitResponse): boolean {
  return String(body.Status ?? "")
    .trim()
    .toLowerCase() === "success";
}

async function gatewayPost(body: Record<string, string>): Promise<FreshpayInitResponse & FreshpayVerifyResponse> {
  const base = getFreshpayGatewayUrl().replace(/\/+$/, "");
  const url = `${base}/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as FreshpayInitResponse & FreshpayVerifyResponse;
  return json;
}

function merchantFields(): { merchant_id: string; merchant_secrete: string } {
  return {
    merchant_id: getFreshpayMerchantId(),
    merchant_secrete: getFreshpayMerchantSecret(),
  };
}

export type FreshpayPayInArgs = {
  reference: string;
  amount: string;
  currency: "USD" | "CDF";
  customerNumber: string;
  method: string;
};

export type FreshpayPayOutArgs = FreshpayPayInArgs;

function merchantIdentityFields(): {
  firstname: string;
  lastname: string;
  "e-mail": string;
} {
  return {
    firstname: FRESHPAY_MERCHANT_IDENTITY.firstname,
    lastname: FRESHPAY_MERCHANT_IDENTITY.lastname,
    "e-mail": FRESHPAY_MERCHANT_IDENTITY.email,
  };
}

/** C2B — debit customer mobile wallet (deposit). */
export async function freshpayPayIn(args: FreshpayPayInArgs): Promise<{
  accepted: boolean;
  response: FreshpayInitResponse;
}> {
  const phone = formatFreshpayCustomerNumber(normalizeCodPhoneNumber(args.customerNumber));
  const response = await gatewayPost({
    ...merchantFields(),
    amount: args.amount,
    currency: args.currency,
    action: "debit",
    customer_number: phone,
    ...merchantIdentityFields(),
    reference: args.reference,
    method: toFreshpayMethod(args.method),
    callback_url: getAppAbsoluteUrl("/api/webhooks/freshpay"),
  });
  return { accepted: isFreshpayInitAccepted(response), response };
}

/** B2C — credit customer mobile wallet (withdrawal). */
export async function freshpayPayOut(args: FreshpayPayOutArgs): Promise<{
  accepted: boolean;
  response: FreshpayInitResponse;
}> {
  const phone = formatFreshpayCustomerNumber(normalizeCodPhoneNumber(args.customerNumber));
  const response = await gatewayPost({
    ...merchantFields(),
    amount: args.amount,
    currency: args.currency,
    action: "credit",
    customer_number: phone,
    ...merchantIdentityFields(),
    reference: args.reference,
    method: toFreshpayMethod(args.method),
    callback_url: getAppAbsoluteUrl("/api/webhooks/freshpay"),
  });
  return { accepted: isFreshpayInitAccepted(response), response };
}

/** Status check — use merchant reference or provider transaction id. */
export async function freshpayVerify(reference: string): Promise<FreshpayVerifyResponse> {
  return gatewayPost({
    ...merchantFields(),
    action: "verify",
    reference,
  });
}

/** Decrypt + authenticate inbound callback. */
export function parseFreshpayCallback(req: Request, body: { data?: string }): FreshpayCallbackPayload {
  assertFreshpayCallbackIp(req);
  const encrypted = body.data?.trim();
  if (!encrypted) {
    throw new Error("missing_encrypted_data");
  }
  const signature = req.headers.get("x-signature") ?? req.headers.get("X-Signature");
  if (!signature) {
    throw new Error("missing_signature");
  }
  if (!verifyFreshpaySignature(encrypted, signature)) {
    throw new Error("invalid_signature");
  }
  return decryptFreshpayPayload(encrypted) as FreshpayCallbackPayload;
}

/** Provider facade — swap rail without touching wallet engine callers. */
export const FreshPayProvider = {
  payIn: freshpayPayIn,
  payOut: freshpayPayOut,
  verify: freshpayVerify,
  parseCallback: parseFreshpayCallback,
  mapTransStatus: mapFreshpayTransStatus,
};
