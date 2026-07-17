import { timingSafeEqual } from "node:crypto";
import { getPawapayCallbackIps, getPawapayCallbackSecret } from "@/lib/env";

/**
 * Optional IP allowlist for PawaPay callbacks.
 * Production IPs (docs): 18.192.208.15, 18.195.113.136, 3.72.212.107,
 * 54.73.125.42, 54.155.38.214, 54.73.130.113
 * Sandbox: 3.64.89.224
 */
export function assertPawapayCallbackIp(req: Request): void {
  const allowed = getPawapayCallbackIps();
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

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * If `PAWAPAY_CALLBACK_SECRET` is set, require it on the callback request.
 * Does not replace official RFC-9421 signed callbacks (public keys).
 */
export function assertPawapayCallbackSecret(req: Request): void {
  const expected = getPawapayCallbackSecret();
  if (!expected) return;

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
