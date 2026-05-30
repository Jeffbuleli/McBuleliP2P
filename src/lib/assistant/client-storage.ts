/** Browser-only keys for the AI assistant widget. */

export const ASSISTANT_CONVERSATION_KEY = "mcbuleli_ai_conversation";
export const ASSISTANT_GUEST_KEY = "mcbuleli_ai_guest";
export const ASSISTANT_SESSION_USER_KEY = "mcbuleli_ai_session_user";

export function clearAssistantClientStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ASSISTANT_CONVERSATION_KEY);
  localStorage.removeItem(ASSISTANT_GUEST_KEY);
  localStorage.removeItem(ASSISTANT_SESSION_USER_KEY);
}

export function readAssistantSessionUser(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ASSISTANT_SESSION_USER_KEY) ?? "";
}

export function writeAssistantSessionUser(userId: string | null): void {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(ASSISTANT_SESSION_USER_KEY, userId);
  } else {
    localStorage.removeItem(ASSISTANT_SESSION_USER_KEY);
  }
}

/** Clear assistant data when the auth session no longer matches stored owner. */
export function syncAssistantSessionUser(sessionUserId: string | null): boolean {
  const stored = readAssistantSessionUser();
  const current = sessionUserId ?? "";
  if (stored === current) return false;
  clearAssistantClientStorage();
  writeAssistantSessionUser(sessionUserId);
  return true;
}
