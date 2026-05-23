import { getAppOrigin } from "@/lib/app-url";

/**
 * Absolute URL for avatars / uploads in prod (deep links, OG).
 * Otherwise keeps same-origin relative paths (dev).
 */
export function resolvePublicAssetUrl(path: string | null | undefined): string | null {
  if (path == null || typeof path !== "string") return null;
  const p = path.trim();
  if (p.length === 0) return null;
  if (p.startsWith("data:image/")) return p;
  if (p.startsWith("https://") || p.startsWith("http://")) return p;
  const base = typeof process !== "undefined" ? getAppOrigin() : "";
  const normalized = p.startsWith("/") ? p : `/${p}`;
  return base ? `${base}${normalized}` : normalized;
}
