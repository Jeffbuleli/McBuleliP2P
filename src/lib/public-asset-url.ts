/**
 * Absolute URL for avatars / uploads when NEXT_PUBLIC_APP_URL is set (prod, deep links).
 * Otherwise keeps same-origin relative paths (dev).
 */
export function resolvePublicAssetUrl(path: string | null | undefined): string | null {
  if (path == null || typeof path !== "string") return null;
  const p = path.trim();
  if (p.length === 0) return null;
  if (p.startsWith("https://") || p.startsWith("http://")) return p;
  const base =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "";
  const normalized = p.startsWith("/") ? p : `/${p}`;
  return base ? `${base}${normalized}` : normalized;
}
