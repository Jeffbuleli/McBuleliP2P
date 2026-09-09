import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  OPS_COOKIE,
  OPS_ROLE_COOKIE,
  resolveOpsRole,
} from "@/lib/ops/auth-tokens";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const BLOCKED_PREFIXES = [
  "/api/admin",
  "/api/internal",
  "/.env",
  "/wp-admin",
  "/wp-login",
];

const OPS_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

function publicOrigin(request: NextRequest): string {
  const proto =
    request.headers.get("x-forwarded-proto") ||
    (request.nextUrl.protocol === "https:" ? "https" : "http");
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host;
  return `${proto}://${host}`;
}

function refreshOpsCookies(
  response: NextResponse,
  token: string,
  role: string,
  secure: boolean,
) {
  const opts = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: OPS_COOKIE_MAX_AGE,
  };
  response.cookies.set(OPS_COOKIE, token, opts);
  response.cookies.set(OPS_ROLE_COOKIE, role, opts);
}

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

  const secure =
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https";

  const cookie = request.cookies.get(OPS_COOKIE)?.value;
  const role = resolveOpsRole(cookie);

  // Déjà connecté sur /ops/login → renvoyer vers la file (évite re-saisie)
  if (pathname === "/ops/login") {
    if (role && cookie) {
      const next = request.nextUrl.searchParams.get("next") || "/ops";
      const dest = new URL(next.startsWith("/") ? next : "/ops", publicOrigin(request));
      if (!dest.pathname.startsWith("/ops")) {
        dest.pathname = "/ops";
        dest.search = "";
      }
      const res = NextResponse.redirect(dest);
      refreshOpsCookies(res, cookie, role, secure);
      return res;
    }
    return NextResponse.next();
  }

  const adminToken =
    process.env.NGEMBA_OPS_TOKEN_ADMIN?.trim() ||
    process.env.NGEMBA_OPS_TOKEN?.trim();
  if (!adminToken) {
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    return new NextResponse("NGEMBA ops auth not configured", { status: 503 });
  }

  // Token valide = session OK. Un roleCookie décalé ne doit plus déconnecter.
  if (!role || !cookie) {
    const login = new URL("/ops/login", publicOrigin(request));
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Sliding session (14 j) + resync role cookie
  refreshOpsCookies(response, cookie, role, secure);
  return response;
}

export const config = {
  matcher: ["/ops/:path*", "/api/alerts"],
};
