import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OPS_COOKIE, OPS_ROLE_COOKIE, resolveOpsRole } from "@/lib/ops/auth-tokens";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const BLOCKED_PREFIXES = [
  "/api/admin",
  "/api/internal",
  "/.env",
  "/wp-admin",
  "/wp-login",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return new NextResponse(null, { status: 404 });
  }

  if (pathname === "/api/alerts" && request.method === "POST") {
    const ip = clientIp(request);
    const rl = rateLimit(`alert-create:${ip}`, 12, 60_000);
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  }

  if (!pathname.startsWith("/ops")) return NextResponse.next();
  if (pathname === "/ops/login") return NextResponse.next();

  const adminToken =
    process.env.NGEMBA_OPS_TOKEN_ADMIN?.trim() ||
    process.env.NGEMBA_OPS_TOKEN?.trim();
  if (!adminToken) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("NGEMBA ops auth not configured", { status: 503 });
  }

  const cookie = request.cookies.get(OPS_COOKIE)?.value;
  const role = resolveOpsRole(cookie);
  const roleCookie = request.cookies.get(OPS_ROLE_COOKIE)?.value;

  if (!role || (roleCookie && roleCookie !== role)) {
    const login = new URL("/ops/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/ops/:path*", "/api/alerts"],
};
