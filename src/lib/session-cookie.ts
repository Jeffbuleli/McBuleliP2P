/**
 * Shared session cookie flags for login, register, Pi auth, and logout.
 * Logout must use the same SameSite/Secure as login or the browser may not clear the cookie.
 *
 * Pi Browser / in-app WebView: if the session disappears right after login, set on the host
 * (e.g. Render): SESSION_COOKIE_SAMESITE=none — requires HTTPS (SameSite=None implies Secure).
 */
export function getSessionCookieWriteOptions(maxAgeSeconds: number) {
  const production = process.env.NODE_ENV === "production";
  const raw = process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite: "lax" | "strict" | "none" =
    raw === "none"
      ? "none"
      : raw === "strict"
        ? "strict"
        : raw === "lax"
          ? "lax"
          : production
            ? "none"
            : "lax";
  const secure = production || sameSite === "none";
  return {
    httpOnly: true as const,
    secure,
    sameSite,
    path: "/" as const,
    maxAge: maxAgeSeconds,
  };
}

/** Expire session cookie — attributes must match how the cookie was set. */
export function getSessionCookieClearOptions() {
  const production = process.env.NODE_ENV === "production";
  const raw = process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite: "lax" | "strict" | "none" =
    raw === "none"
      ? "none"
      : raw === "strict"
        ? "strict"
        : raw === "lax"
          ? "lax"
          : production
            ? "none"
            : "lax";
  const secure = production || sameSite === "none";
  return {
    httpOnly: true as const,
    secure,
    sameSite,
    path: "/" as const,
    maxAge: 0,
  };
}
