import { checkRateLimit, rateLimitKeyIpRaw } from "@/lib/rate-limit";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Paths exempt from global API IP throttle (webhooks, crons, public config). */
const EXEMPT_PREFIXES = [
  "/api/webhooks/",
  "/api/internal/",
  "/api/config/",
  "/api/health",
];

export function shouldMiddlewareThrottleApi(
  pathname: string,
  method: string,
): boolean {
  if (!pathname.startsWith("/api/")) return false;
  if (!MUTATING.has(method.toUpperCase())) return false;
  if (EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

/** Bucket by IP + first 3 API segments (e.g. /api/wallet/transfer). */
export function middlewareApiRateLimit(
  pathname: string,
  ip: string,
): number | null {
  const parts = pathname.split("/").filter(Boolean);
  const bucket = parts.slice(0, 3).join("/") || "api";
  const result = checkRateLimit({
    key: `${rateLimitKeyIpRaw("api:global", ip)}:${bucket}`,
    limit: 120,
    windowMs: 60_000,
  });
  if (!result.ok) return result.retryAfterSec;
  return null;
}
