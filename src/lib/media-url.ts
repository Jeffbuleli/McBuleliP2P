import { getAppOrigin } from "./app-url";
import {
  mediaPublicHostnames,
  mediaPublicOrigins,
  normalizePublicMediaUrl,
} from "./media-url-config";

export {
  mediaPublicHostnames,
  mediaPublicOrigins,
  normalizePublicMediaUrl,
} from "./media-url-config";

export function resolveMediaSrc(url: string | null | undefined): string | null {
  const normalized = normalizePublicMediaUrl(url);
  if (!normalized) return null;
  if (
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }
  const base = typeof process !== "undefined" ? getAppOrigin() : "";
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return base ? `${base}${path}` : path;
}
