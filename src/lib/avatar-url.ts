import { getAppOrigin } from "@/lib/app-url";
import { normalizePublicMediaUrl } from "@/lib/media-url";

/** Avatar sources we can render in <img> (DB may store data URLs on serverless). */
export function isDisplayableAvatarUrl(
  url: string | null | undefined,
): url is string {
  if (typeof url !== "string" || url.length < 1) return false;
  return (
    url.startsWith("data:image/") ||
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}

export function resolveAvatarSrc(url: string | null | undefined): string | null {
  if (!isDisplayableAvatarUrl(url)) return null;
  if (url.startsWith("data:image/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return normalizePublicMediaUrl(url) ?? url;
  }
  const base = typeof process !== "undefined" ? getAppOrigin() : "";
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return base ? `${base}${normalized}` : normalized;
}
