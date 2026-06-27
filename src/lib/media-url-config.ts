/** Hostnames allowed to serve community / academy media in CSP and next/image. */
const DEFAULT_MEDIA_HOSTNAMES = [
  "media.mcbuleli.org",
  "cdn.mcbuleli.org",
] as const;

function hostnameFromEnvUrl(envKey: string): string | null {
  const raw = process.env[envKey]?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

export function mediaPublicHostnames(): string[] {
  const hosts = new Set<string>(DEFAULT_MEDIA_HOSTNAMES);
  for (const key of [
    "COMMUNITY_R2_PUBLIC_BASE_URL",
    "ACADEMY_R2_PUBLIC_BASE_URL",
  ]) {
    const h = hostnameFromEnvUrl(key);
    if (h) hosts.add(h);
  }
  return [...hosts];
}

export function mediaPublicOrigins(): string[] {
  return mediaPublicHostnames().map((h) => `https://${h}`);
}

/** Rewrite direct R2 dev URLs to the configured custom domain when possible. */
export function normalizePublicMediaUrl(
  url: string | null | undefined,
): string | null {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const canonicalBase = process.env.COMMUNITY_R2_PUBLIC_BASE_URL?.trim();
    if (canonicalBase && parsed.hostname.endsWith(".r2.dev")) {
      const base = new URL(canonicalBase);
      return `${base.origin}${parsed.pathname}${parsed.search}`;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
