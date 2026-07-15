"use client";

import { useI18n } from "@/components/i18n-provider";
import { SupportAgentIcon } from "@/components/icons/support-agent-icon";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_WA_PHONE,
  SUPPORT_X,
} from "@/lib/support-contact";

export function SupportContactPanel({ showIcon = true }: { showIcon?: boolean }) {
  const { t } = useI18n();

  return (
    <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-4">
      {showIcon ? (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/15">
          <SupportAgentIcon className="h-5 w-5" />
        </div>
      ) : null}
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
            WhatsApp
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
  );
}
