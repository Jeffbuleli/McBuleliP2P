import crypto from "crypto";
import { getJwtSecret } from "@/lib/env";

function deriveKey(): Buffer {
  return crypto.createHash("sha256").update(getJwtSecret()).digest();
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function randomDigits(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String(crypto.randomInt(0, 10));
  }
  return out;
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", deriveKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("invalid_secret");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    deriveKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateWaVerifyCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[crypto.randomInt(0, alphabet.length)]!;
  }
  return `McB-${suffix}`;
}

export const WA_MESSAGE_TEMPLATES = [
  (code: string) => `C'est mon numéro McBuleli : ${code}`,
  (code: string) => `McBuleli verify ${code}`,
  (code: string) => `${code} · compte McBuleli`,
] as const;

export function pickWaMessageTemplate(code: string, seed: number): string {
  const idx = seed % WA_MESSAGE_TEMPLATES.length;
  return WA_MESSAGE_TEMPLATES[idx]!(code);
}
