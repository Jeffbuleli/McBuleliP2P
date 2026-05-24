"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { SupportContactPanel } from "@/components/support/support-contact-panel";

export function AuthRecoveryAlternatives() {
  const { t } = useI18n();

  return (
    <div className="mt-6 space-y-4 border-t border-[color:var(--fd-border)] pt-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
          {t("forgot_other_heading")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--fd-muted)]">
          {t("forgot_other_hint")}
        </p>
        <Link
          href="/account/recovery"
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-4 text-sm font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:bg-[color:var(--fd-mint)]/80"
        >
          {t("forgot_other_wa")}
        </Link>
      </div>

      <SupportContactPanel />
    </div>
  );
}
