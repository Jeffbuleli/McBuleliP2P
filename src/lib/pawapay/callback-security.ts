import { getPawapayCallbackIps } from "@/lib/env";

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
