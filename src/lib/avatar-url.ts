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
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "";
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return base ? `${base}${normalized}` : normalized;
}
