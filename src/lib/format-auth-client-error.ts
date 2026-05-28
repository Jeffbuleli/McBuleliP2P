import type { Messages } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";

/** Parse JSON API errors for display (maps totp_*, withdraw_*, etc. when `t` is passed). */
export function formatAuthClientError(
  data: unknown,
  t?: (key: keyof Messages, vars?: Record<string, string | number>) => string,
): string {
  if (!data || typeof data !== "object") {
    return t ? t("group_action_failed") : "Something went wrong.";
  }
  const d = data as Record<string, unknown>;
  const code =
    typeof d.message === "string"
      ? d.message
      : typeof d.error === "string"
        ? d.error
        : null;
  if (code && t) {
    const detail = typeof d.detail === "string" ? d.detail.trim() : "";
    const base = clientErrorText(t, code);
    if (detail && detail.length <= 240 && !code.includes(detail)) {
      return `${base} (${detail})`;
    }
    return base;
  }
  if (typeof d.message === "string") {
    const detail = typeof d.detail === "string" ? d.detail.trim() : "";
    if (detail && detail.length <= 240) {
      return `${d.message} (${detail})`;
    }
    return d.message;
  }
  if (typeof d.error === "string") {
    return d.error;
  }
  const fe = d.fieldErrors as Record<string, string[] | undefined> | undefined;
  if (fe) {
    const parts = Object.entries(fe).flatMap(([key, vals]) =>
      (vals ?? []).map((v) => `${key}: ${v}`),
    );
    if (parts.length) {
      return parts.join(" · ");
    }
  }
  return "Could not complete request.";
}
