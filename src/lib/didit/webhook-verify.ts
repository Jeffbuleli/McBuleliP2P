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

function timingSafeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Verify Didit X-Signature-V2 (recommended). */
export function verifyDiditWebhookSignatureV2(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  timestampHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !timestampHeader || !secret) return false;
  const ts = parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

  const canonical = JSON.stringify(sortKeys(shortenFloats(body)));
  const expected = crypto
    .createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

/** Fallback: X-Signature-Simple (envelope only). */
export function verifyDiditWebhookSignatureSimple(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  timestampHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !timestampHeader || !secret) return false;
  const ts = parseInt(timestampHeader, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) return false;

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

export function verifyDiditWebhookRequest(
  body: Record<string, unknown>,
  headers: Headers,
  secret: string,
): boolean {
  if (!secret) return true;
  const ts = headers.get("x-timestamp");
  const sigV2 = headers.get("x-signature-v2");
  if (verifyDiditWebhookSignatureV2(body, sigV2, ts, secret)) return true;
  const sigSimple = headers.get("x-signature-simple");
  return verifyDiditWebhookSignatureSimple(body, sigSimple, ts, secret);
}
