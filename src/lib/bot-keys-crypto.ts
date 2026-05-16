import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

function deriveKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret, "utf8").digest();
}

function encryptionSecret(): string {
  const s = process.env.BOT_KEYS_ENCRYPTION_SECRET?.trim();
  if (!s || s.length < 32) {
    throw new Error(
      "BOT_KEYS_ENCRYPTION_SECRET must be set (min 32 characters)",
    );
  }
  return s;
}

export type StoredBinanceCredentials = {
  apiKey: string;
  apiSecret: string;
};

export function encryptBinanceCredentials(
  creds: StoredBinanceCredentials,
): string {
  const key = deriveKey(encryptionSecret());
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const plain = JSON.stringify(creds);
  const enc = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptBinanceCredentials(
  ciphertextB64: string,
): StoredBinanceCredentials {
  const key = deriveKey(encryptionSecret());
  const buf = Buffer.from(ciphertextB64, "base64");
  if (buf.length < IV_LEN + 16 + 1) {
    throw new Error("Invalid credentials blob");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const enc = buf.subarray(IV_LEN + 16);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([
    decipher.update(enc),
    decipher.final(),
  ]).toString("utf8");
  const parsed = JSON.parse(plain) as StoredBinanceCredentials;
  if (!parsed.apiKey?.trim() || !parsed.apiSecret?.trim()) {
    throw new Error("Corrupt credentials payload");
  }
  return {
    apiKey: parsed.apiKey.trim(),
    apiSecret: parsed.apiSecret.trim(),
  };
}

export function apiKeyHint(apiKey: string): string {
  const k = apiKey.trim();
  if (k.length <= 8) return "****";
  return `${k.slice(0, 4)}…${k.slice(-4)}`;
}
