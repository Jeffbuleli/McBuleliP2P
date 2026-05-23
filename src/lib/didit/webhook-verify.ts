import crypto from "crypto";

function shortenFloats(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(shortenFloats);
  if (data !== null && typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data as Record<string, unknown>).map(([k, v]) => [
        k,
        shortenFloats(v),
      ]),
    );
  }
  if (typeof data === "number" && !Number.isInteger(data) && data % 1 === 0) {
    return Math.trunc(data);
  }
  return data;
}

function sortKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

/** Didit canonical JSON (sort_keys, compact, unescaped Unicode). */
export function diditCanonicalJson(body: Record<string, unknown>): string {
  return JSON.stringify(sortKeys(shortenFloats(body)));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function header(headers: Headers, name: string): string | null {
  return headers.get(name) ?? headers.get(name.toLowerCase());
}

/** Verify Didit X-Signature-V2 (recommended for V3 webhooks). */
export function verifyDiditWebhookSignatureV2(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const canonical = diditCanonicalJson(body);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

/** Legacy X-Signature over exact raw bytes Didit transmitted. */
export function verifyDiditWebhookSignatureRaw(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret || !rawBody) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

/** Fallback: X-Signature-Simple (envelope only — no decision integrity). */
export function verifyDiditWebhookSignatureSimple(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const canonical = [
    body.timestamp ?? "",
    body.session_id ?? "",
    body.status ?? "",
    body.webhook_type ?? "",
  ].join(":");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical)
    .digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

export type VerifyDiditWebhookArgs = {
  body: Record<string, unknown>;
  rawBody: string;
  headers: Headers;
  secret: string;
};

/**
 * Verify Didit webhook (V3). Order: V2 → raw X-Signature → Simple.
 * Timestamp is not enforced — Try Webhook fixtures use old example timestamps.
 */
export function verifyDiditWebhookRequest(args: VerifyDiditWebhookArgs): boolean {
  const { body, rawBody, headers, secret } = args;
  if (!secret) return true;

  const sigV2 = header(headers, "x-signature-v2");
  const sigRaw = header(headers, "x-signature");
  const sigSimple = header(headers, "x-signature-simple");

  if (sigV2 && verifyDiditWebhookSignatureV2(body, sigV2, secret)) return true;
  if (sigRaw && verifyDiditWebhookSignatureRaw(rawBody, sigRaw, secret)) {
    return true;
  }
  if (sigSimple && verifyDiditWebhookSignatureSimple(body, sigSimple, secret)) {
    return true;
  }

  return false;
}
