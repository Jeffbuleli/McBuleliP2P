import type { Messages } from "@/i18n/messages";

/** Map API `{ error }` / `{ message }` payloads to i18n keys (never show raw DB text). */
export function apiErrorText(
  t: (k: keyof Messages, vars?: Record<string, string | number>) => string,
  data: { error?: unknown; message?: unknown },
  fallback: keyof Messages,
): string {
  if (typeof data.error === "string" && isKnownKey(data.error)) {
    return t(data.error as keyof Messages);
  }
  if (typeof data.message === "string") {
    if (data.message === "Forbidden") return t("admin_forbidden");
    if (data.message === "Not found") return t("admin_not_found");
    if (isKnownKey(data.message)) return t(data.message as keyof Messages);
  }
  return t(fallback);
}

function isKnownKey(key: string): boolean {
  return (
    key.startsWith("group_") ||
    key.startsWith("admin_") ||
    key.startsWith("wallet_") ||
    key.startsWith("p2p_") ||
    key.startsWith("deposit_")
  );
}
