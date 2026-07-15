import { createDecipheriv, createHmac, timingSafeEqual } from "node:crypto";
import {
  getFreshpayAesKey,
  getFreshpayCallbackIps,
  getFreshpayHmacKey,
} from "@/lib/env";

export function assertFreshpayCallbackIp(req: Request): void {
  const allowed = getFreshpayCallbackIps();
  if (allowed.length === 0) return;

  const cf = req.headers.get("cf-connecting-ip")?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  const xff = forwarded
    ?.split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .pop();
  const ip = (cf || real || xff || "").trim();
  if (!ip || !allowed.includes(ip)) {
    throw new Error("callback_ip_denied");
  }
}

export function verifyFreshpaySignature(encryptedData: string, receivedSignature: string): boolean {
  const hmacKey = getFreshpayHmacKey();
  const calculated = createHmac("sha256", hmacKey).update(encryptedData).digest("hex");
  const a = Buffer.from(calculated, "utf8");
  const b = Buffer.from(receivedSignature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** AES-128-CBC per FreshPay / MOKO sample implementations (IV = key). */
export function decryptFreshpayPayload(encryptedData: string): Record<string, unknown> {
  const key = Buffer.from(getFreshpayAesKey(), "utf8");
  if (key.length !== 16) {
    throw new Error("invalid_aes_key_length");
  }
  const decipher = createDecipheriv("aes-128-cbc", key, key);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return JSON.parse(decrypted) as Record<string, unknown>;
}
