import { timingSafeEqual } from "node:crypto";
import { getPawapayCallbackIps, getPawapayCallbackSecret } from "@/lib/env";

/**
 * Official PawaPay callback source IPs (docs).
 * Applied automatically in production when `PAWAPAY_CALLBACK_IPS` is unset.
 */
export const PAWAPAY_PRODUCTION_CALLBACK_IPS = [
  "18.192.208.15",
  "18.195.113.136",
  "3.72.212.107",
  "54.73.125.42",
  "54.155.38.214",
  "54.73.130.113",
  // Sandbox (kept so mis-set env still works in mixed setups)
  "3.64.89.224",
] as const;

function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").toLowerCase();
  return appUrl.includes("mcbuleli.com") || appUrl.includes("mcbuleli.org");
}

function resolvedCallbackIps(): string[] {
  const configured = getPawapayCallbackIps();
  if (configured.length > 0) return configured;
  if (isProductionRuntime()) return [...PAWAPAY_PRODUCTION_CALLBACK_IPS];
  return [];
}

/**
 * IP allowlist for PawaPay callbacks.
 * Production: always enforced (configured list or official defaults).
 * Dev: only if `PAWAPAY_CALLBACK_IPS` is set.
 */
export function assertPawapayCallbackIp(req: Request): void {
  const allowed = resolvedCallbackIps();
  if (allowed.length === 0) return;

  const cf = req.headers.get("cf-connecting-ip")?.trim();
  const real = req.headers.get("x-real-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  // Prefer Cloudflare edge IP; fall back to right-most XFF hop (nginx client).
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

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Shared secret for inbound callbacks (defense in depth).
 * Production: required when `PAWAPAY_CALLBACK_SECRET` is set (recommended).
 * If unset in production, IP allowlist alone still applies (see above).
 */
export function assertPawapayCallbackSecret(req: Request): void {
  const expected = getPawapayCallbackSecret();
  if (!expected) {
    if (isProductionRuntime() && process.env.PAWAPAY_REQUIRE_CALLBACK_SECRET === "1") {
      throw new Error("callback_secret_denied");
    }
    return;
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const headerSecret =
    req.headers.get("x-callback-secret")?.trim() ||
    req.headers.get("x-pawapay-callback-secret")?.trim() ||
    "";

  const provided = bearer || headerSecret;
  if (!provided || !safeEqualString(provided, expected)) {
    throw new Error("callback_secret_denied");
  }
}
