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

function escapeJsonStringPreserveUnicode(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    const code = ch.charCodeAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === '"') out += '\\"';
    else if (code < 0x20) {
      if (ch === "\n") out += "\\n";
      else if (ch === "\r") out += "\\r";
      else if (ch === "\t") out += "\\t";
      else out += `\\u${code.toString(16).padStart(4, "0")}`;
    } else out += ch;
  }
  return out;
}

function stringifyCanonical(value: unknown): string {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "null";
    if (!Number.isInteger(value) && value % 1 === 0) {
      return String(Math.trunc(value));
    }
    return String(value);
  }
  if (typeof value === "string") {
    return `"${escapeJsonStringPreserveUnicode(value)}"`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stringifyCanonical(v)).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const v = obj[key];
      if (v === undefined) continue;
      parts.push(
        `"${escapeJsonStringPreserveUnicode(key)}":${stringifyCanonical(v)}`,
      );
    }
    return `{${parts.join(",")}}`;
  }
  return "null";
}

/** Didit X-Signature-V2 canonical JSON (sort_keys, compact, Unicode not escaped). */
export function diditCanonicalJson(body: Record<string, unknown>): string {
  return stringifyCanonical(sortKeys(shortenFloats(body)));
}

function timingSafeEqualHex(a: string, b: string): boolean {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  if (!x || !y || x.length !== y.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(x, "utf8"), Buffer.from(y, "utf8"));
  } catch {
    return false;
  }
}

function header(headers: Headers, name: string): string | null {
  return headers.get(name);
}

export function isDiditTestWebhook(headers: Headers): boolean {
  const v = header(headers, "x-didit-test-webhook")?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

const WEBHOOK_MAX_AGE_SEC = 300;

/** Reject replayed webhooks (X-Timestamp must be within 300s). */
export function isDiditWebhookTimestampFresh(
  headers: Headers,
  body?: Record<string, unknown>,
): boolean {
  const raw =
    header(headers, "x-timestamp") ??
    (body?.timestamp != null ? String(body.timestamp) : null);
  const ts = Number(raw);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const nowSec = Date.now() / 1000;
  return Math.abs(nowSec - ts) <= WEBHOOK_MAX_AGE_SEC;
}

function hmacHex(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Verify Didit X-Signature-V2 (recommended for V3 webhooks). */
export function verifyDiditWebhookSignatureV2(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const normalized = sortKeys(shortenFloats(body)) as Record<string, unknown>;
  const canonicalUnicode = diditCanonicalJson(body);
  const canonicalAscii = JSON.stringify(normalized);
  const expectedUnicode = hmacHex(secret, canonicalUnicode);
  const expectedAscii = hmacHex(secret, canonicalAscii);
  return (
    timingSafeEqualHex(expectedUnicode, signatureHeader) ||
    timingSafeEqualHex(expectedAscii, signatureHeader)
  );
}

/** Legacy X-Signature over exact raw bytes Didit transmitted. */
export function verifyDiditWebhookSignatureRaw(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !secret || !rawBody) return false;
  return timingSafeEqualHex(hmacHex(secret, rawBody), signatureHeader);
}

/** Fallback: X-Signature-Simple (envelope only). */
export function verifyDiditWebhookSignatureSimple(
  body: Record<string, unknown>,
  signatureHeader: string | null,
  secret: string,
  timestampHeader: string | null,
): boolean {
  if (!signatureHeader || !secret) return false;
  const ts = body.timestamp ?? timestampHeader ?? "";
  const variants = [
    [ts, body.session_id, body.status, body.webhook_type],
    [String(ts), body.session_id, body.status, body.webhook_type],
    [ts, body.session_id ?? "", body.status ?? "", body.webhook_type ?? ""],
  ];
  for (const parts of variants) {
    const canonical = parts.map((p) => String(p ?? "")).join(":");
    if (timingSafeEqualHex(hmacHex(secret, canonical), signatureHeader)) {
      return true;
    }
  }
  return false;
}

export type VerifyDiditWebhookArgs = {
  body: Record<string, unknown>;
  rawBody: string;
  headers: Headers;
  secret: string;
};

/**
 * Verify Didit webhook (V3). Console "Try Webhook" sets X-Didit-Test-Webhook: true.
 */
export function verifyDiditWebhookRequest(args: VerifyDiditWebhookArgs): boolean {
  const { body, rawBody, headers, secret } = args;
  if (!secret) return true;

  if (isDiditTestWebhook(headers)) {
    return true;
  }

  if (!isDiditWebhookTimestampFresh(headers, body)) {
    return false;
  }

  const sigV2 = header(headers, "x-signature-v2");
  const sigRaw = header(headers, "x-signature");
  const sigSimple = header(headers, "x-signature-simple");
  const ts = header(headers, "x-timestamp");

  if (sigV2 && verifyDiditWebhookSignatureV2(body, sigV2, secret)) return true;
  if (sigRaw && verifyDiditWebhookSignatureRaw(rawBody, sigRaw, secret)) {
    return true;
  }
  if (
    sigSimple &&
    verifyDiditWebhookSignatureSimple(body, sigSimple, secret, ts)
  ) {
    return true;
  }

  return false;
}
