/** Canonical production origin (apex). Set NEXT_PUBLIC_APP_URL=https://mcbuleli.org on Render. */
export const CANONICAL_PRODUCTION_ORIGIN = "https://mcbuleli.org";

/**
 * Public site origin for invite links, OG metadata, avatars, webhooks docs.
 * Priority: NEXT_PUBLIC_APP_URL → RENDER_EXTERNAL_URL → canonical prod.
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const render = process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "");
  if (render) return render;

  if (process.env.NODE_ENV === "production") {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  return "";
}

/** OG / Twitter / favicon absolute URLs — prefer canonical domain in production. */
export function getMetadataOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    return CANONICAL_PRODUCTION_ORIGIN;
  }

  const render = process.env.RENDER_EXTERNAL_URL?.trim().replace(/\/$/, "");
  if (render) return render;

  return "";
}

export function getAppAbsoluteUrl(path: string): string {
  const origin = getAppOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${p}` : p;
}

/** Client-safe canonical host for PWA install prompts. */
export function canonicalAppHostname(): string {
  return new URL(CANONICAL_PRODUCTION_ORIGIN).hostname;
}
