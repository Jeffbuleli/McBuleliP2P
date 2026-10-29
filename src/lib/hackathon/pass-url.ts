import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

/** Canonical public badge URL (participants + partners). Safe for Client Components. */
export function passPublicUrl(code: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    CANONICAL_PRODUCTION_ORIGIN;
  return `${origin}/hackathon/pass/${encodeURIComponent(code)}`;
}

/** Relative pass path (same origin as the app). */
export function passPath(code: string): string {
  return `/hackathon/pass/${encodeURIComponent(code)}`;
}
