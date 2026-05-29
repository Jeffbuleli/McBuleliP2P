import type { Messages } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";
import { isTechnicalBinanceMessage } from "@/lib/binance-error-display";

/** Parse JSON API errors for display (maps totp_*, withdraw_*, etc. when `t` is passed). */
export function formatAuthClientError(
  data: unknown,
  t?: (key: keyof Messages, vars?: Record<string, string | number>) => string,
  opts?: { includeAdminDetail?: boolean },
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
  const adminDetail =
    opts?.includeAdminDetail && typeof d.adminDetail === "string"
      ? d.adminDetail.trim().slice(0, 800)
      : "";

  if (code && t) {
    const safeCode = isTechnicalBinanceMessage(code)
      ? "deposit_provider_unavailable"
      : code;
    const base = clientErrorText(t, safeCode);
    return adminDetail ? `${base}\n\n${adminDetail}` : base;
  }
  if (typeof d.message === "string") {
    const msg = d.message.trim();
    if (isTechnicalBinanceMessage(msg)) {
      const base = t ? clientErrorText(t, "deposit_provider_unavailable") : "Could not complete request.";
      return adminDetail ? `${base}\n\n${adminDetail}` : base;
    }
    if (t) {
      const base = clientErrorText(t, msg);
      return adminDetail ? `${base}\n\n${adminDetail}` : base;
    }
    return adminDetail ? `${msg}\n\n${adminDetail}` : msg;
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
