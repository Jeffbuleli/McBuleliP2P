/** Canonical production origin (apex). Vercel: set as Primary Domain. */
export const CANONICAL_PRODUCTION_ORIGIN = "https://mcbuleli.org";

/**
 * Public site origin for invite links, OG metadata, avatars, webhooks docs.
 * Priority: NEXT_PUBLIC_APP_URL → RENDER_EXTERNAL_URL → canonical prod → Vercel preview host.
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const render = process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "");
  if (render) return render;

  if (
    process.env.VERCEL_ENV === "production" ||
    (process.env.NODE_ENV === "production" && !process.env.VERCEL_URL)
  ) {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  return "";
}

export function getAppAbsoluteUrl(path: string): string {
  const origin = getAppOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${p}` : p;
}
