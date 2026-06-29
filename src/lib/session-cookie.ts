/**
 * Shared session cookie flags for login, register, Pi auth, and logout.
 * Logout must use the same SameSite/Secure as login or the browser may not clear the cookie.
 *
 * Default SameSite is Lax (reliable for mcbuleli.org). Set SESSION_COOKIE_SAMESITE=none
 * only for Pi Browser / embedded WebViews that require cross-site cookies.
 */
import { sessionMaxAgeSeconds } from "@/lib/session-config";

export { sessionMaxAgeSeconds };

export function getSessionCookieWriteOptions(
  maxAgeSeconds = sessionMaxAgeSeconds(),
) {
  const production = process.env.NODE_ENV === "production";
  const raw = process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite: "lax" | "strict" | "none" =
    raw === "none"
      ? "none"
      : raw === "strict"
        ? "strict"
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

/** Expire session cookie - attributes must match how the cookie was set. */
export function getSessionCookieClearOptions() {
  const production = process.env.NODE_ENV === "production";
  const raw = process.env.SESSION_COOKIE_SAMESITE?.trim().toLowerCase();
  const sameSite: "lax" | "strict" | "none" =
    raw === "none"
      ? "none"
      : raw === "strict"
        ? "strict"
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
