import { safeAppRedirectPath } from "@/lib/safe-app-path";

const STORAGE_KEY = "mcb_auth_return_path";

/** Persist intended in-app destination across login ↔ register hops. */
export function storeAuthReturnPath(path: string): void {
  if (typeof window === "undefined") return;
  try {
    const safe = safeAppRedirectPath(path);
    sessionStorage.setItem(STORAGE_KEY, safe);
  } catch {
    /* private mode */
  }
}

export function peekAuthReturnPath(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v ? safeAppRedirectPath(v) : null;
  } catch {
    return null;
  }
}

export function clearAuthReturnPath(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Resolve post-auth path from `?next=`, sessionStorage, or fallback. */
export function resolveAuthReturnPath(
  fromUrl: string | null | undefined,
  fallback = "/app",
): string {
  const trimmed = fromUrl?.trim();
  if (trimmed) {
    const safe = safeAppRedirectPath(trimmed);
    storeAuthReturnPath(safe);
    return safe;
  }
  return peekAuthReturnPath() ?? safeAppRedirectPath(fallback);
}

export function loginHrefFor(appPath: string): string {
  return `/login?next=${encodeURIComponent(safeAppRedirectPath(appPath))}`;
}

export function registerHrefFor(appPath: string): string {
  return `/register?next=${encodeURIComponent(safeAppRedirectPath(appPath))}`;
}

export function redirectToLoginWithReturn(currentPath?: string): void {
  if (typeof window === "undefined") return;
  const path = safeAppRedirectPath(
    currentPath ?? `${window.location.pathname}${window.location.search}`,
  );
  storeAuthReturnPath(path);
  window.location.assign(loginHrefFor(path));
}

function requestPath(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.pathname;
  if (input instanceof Request) return new URL(input.url).pathname;
  return String(input);
}

/** Redirect to login when an app API call returns 401 (session expired). */
export function maybeRedirectUnauthorized(
  res: Response,
  input: RequestInfo | URL,
): void {
  if (res.status !== 401 || typeof window === "undefined") return;
  const path = requestPath(input);
  if (!path.startsWith("/api/") || path.startsWith("/api/auth/")) return;
  redirectToLoginWithReturn();
}
