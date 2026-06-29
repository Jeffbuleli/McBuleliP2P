/** Edge-safe rate limiter (no Node built-ins - used by middleware). */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Sliding-window rate limiter (per Render instance; pair with Cloudflare WAF in prod). */
export function checkRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(args.key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(args.key, { count: 1, resetAt: now + args.windowMs });
    return { ok: true };
  }
  if (existing.count >= args.limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  existing.count += 1;
  return { ok: true };
}

export function clientIpFromRequest(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real.slice(0, 64);
  return "unknown";
}

export function rateLimitKeyIp(scope: string, req: Request): string {
  return `${scope}:ip:${clientIpFromRequest(req)}`;
}

export function rateLimitKeyIpRaw(scope: string, ip: string): string {
  return `${scope}:ip:${ip.slice(0, 64) || "unknown"}`;
}

export function rateLimitedResponse(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ message: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
