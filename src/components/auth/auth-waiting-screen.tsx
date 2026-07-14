"use client";

import { useI18n } from "@/components/i18n-provider";

/** Minimal wait UI — CSS spinner only (no images). */
export function AuthWaitingScreen({ message }: { message?: string }) {
  const { t } = useI18n();
  return (
    <div
      className="flex min-h-[min(50vh,20rem)] flex-col items-center justify-center gap-3 py-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#305F33]/25 border-t-[#305F33]" />
      <div className="text-center">
        <p className="text-sm font-semibold text-[color:var(--fd-text)]">{t("brand")}</p>
        {message ? (
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
