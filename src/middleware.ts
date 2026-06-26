import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { corsHeaders, resolveAllowedCorsOrigin } from "@/lib/cors";
import { applySecurityHeaders } from "@/lib/security-headers";
import {
  middlewareApiRateLimit,
  shouldMiddlewareThrottleApi,
} from "@/lib/middleware-api-rate-limit";

const CANONICAL_HOST = new URL(CANONICAL_PRODUCTION_ORIGIN).hostname;

/** Legacy hosts → single PWA origin (avoids duplicate home-screen apps). */
const LEGACY_HOSTS = new Set([
  "mcbuleli.online",
  "www.mcbuleli.online",
  "www.mcbuleli.org",
]);

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";

  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");

  if (
    isApi &&
    shouldMiddlewareThrottleApi(pathname, request.method)
  ) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const retryAfter = middlewareApiRateLimit(pathname, ip);
    if (retryAfter !== null) {
      const limited = NextResponse.json(
        { message: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
      applySecurityHeaders(limited.headers);
      return limited;
    }
  }

  const allowedOrigin = isApi
    ? resolveAllowedCorsOrigin(request.headers.get("origin"))
    : null;

  if (isApi && request.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    applySecurityHeaders(preflight.headers);
    for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) {
      preflight.headers.set(key, value);
    }
    return preflight;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers);

  if (isApi && allowedOrigin) {
    for (const [key, value] of Object.entries(corsHeaders(allowedOrigin))) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|brand/|sw.js|manifest.webmanifest|assets/).*)",
  ],
};
