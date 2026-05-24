"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

const SUPPORT_EMAIL = "hi@mcbuleli.org";
const SUPPORT_WA_PATH = "https://wa.me/mcbuleli";
const SUPPORT_WA_PHONE = "https://wa.me/243997366736";
const SUPPORT_X = "https://x.com/McBuleli";

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

      <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]">
          {t("forgot_support_heading")}
        </p>
        <ul className="mt-3 space-y-2.5 text-sm">
          <li>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("forgot_support_email_label")}
            </span>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("forgot_support_wa_label")}
            </span>
            <a
              href={SUPPORT_WA_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            >
              wa.me/mcbuleli
            </a>
            <span className="mx-1 text-[color:var(--fd-muted)]">·</span>
            <a
              href={SUPPORT_WA_PHONE}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            >
              +243 997 366 736
            </a>
          </li>
          <li>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("forgot_support_x_label")}
            </span>
            <a
              href={SUPPORT_X}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            >
              x.com/McBuleli
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
