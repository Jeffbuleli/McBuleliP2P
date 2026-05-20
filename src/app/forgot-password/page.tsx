"use client";

import Link from "next/link";
import {
  AuthMarketingShell,
  AuthPageFooter,
} from "@/components/auth/auth-marketing-shell";
import { useI18n } from "@/components/i18n-provider";

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5">
        <p className="text-sm leading-relaxed text-[color:var(--fd-muted)]">{t("forgot_body")}</p>
        <div className="mt-5 grid gap-2">
          <Link
            href="/contact"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99]"
          >
            {t("forgot_contact")}
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-5 text-sm font-semibold text-[color:var(--fd-text)] active:scale-[0.99]"
          >
            {t("forgot_back_login")}
          </Link>
        </div>
      </div>
    </AuthMarketingShell>
  );
}
