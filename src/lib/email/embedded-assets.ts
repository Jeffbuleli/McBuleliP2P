import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EmailIllustration } from "@/lib/email/config";

const PUBLIC = join(process.cwd(), "public");

const cache = new Map<string, string>();

function readDataUri(relativePath: string, mime = "image/png"): string {
  const key = relativePath;
  const hit = cache.get(key);
  if (hit) return hit;

  const abs = join(PUBLIC, relativePath);
  if (!existsSync(abs)) {
    throw new Error(`[email] missing asset: ${relativePath}`);
  }
  const b64 = readFileSync(abs).toString("base64");
  const uri = `data:${mime};base64,${b64}`;
  cache.set(key, uri);
  return uri;
}

const ILLUSTRATION_FILES: Record<EmailIllustration, string> = {
  verify: "email/email-verify.png",
  reset: "email/email-reset.png",
  change: "email/email-change.png",
  security: "email/email-security.png",
  depositUsdt: "email/email-deposit-usdt.png",
  depositPi: "email/email-deposit-pi.png",
  withdrawUsdt: "email/email-withdraw-usdt.png",
  withdrawPi: "email/email-withdraw-pi.png",
};

/** Inline logo — works in Resend preview & inboxes without hotlinking. */
export function embeddedLogoSrc(): string {
  return readDataUri("brand/logo.png");
}

/** Inline illustration for template sync and transactional sends. */
export function embeddedIllustrationSrc(kind: EmailIllustration): string {
  return readDataUri(ILLUSTRATION_FILES[kind]);
}
