/** Clé citoyenne côté navigateur quand le cookie HttpOnly ne suit pas (PWA, webview). */

const storageKey = (sessionId: string) => `ngemba:session:${sessionId}`;

export function persistSessionCitizenKey(
  sessionId: string,
  key: string | undefined | null,
): void {
  if (!sessionId || !key || typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(sessionId), JSON.stringify({ key }));
  } catch {
    /* quota / private mode */
  }
}

export function readSessionCitizenKey(sessionId: string): string | null {
  if (!sessionId || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { key?: string };
    return typeof parsed.key === "string" && parsed.key.length > 8
      ? parsed.key
      : null;
  } catch {
    return null;
  }
}

export function citizenAuthHeaders(
  sessionId: string,
  base?: HeadersInit,
): HeadersInit {
  const headers = new Headers(base);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const key = readSessionCitizenKey(sessionId);
  if (key) headers.set("X-Ngemba-Citizen", key);
  return headers;
}