import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "x-pathname",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|brand/|sw.js|manifest.webmanifest).*)",
  ],
};
