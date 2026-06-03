/** Allow only same-origin app paths after login/register. */
export function safeAppRedirectPath(raw: string | null | undefined): string {
  const path = raw?.trim() ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return "/app";
  if (path.includes("://")) return "/app";
  return path;
}
