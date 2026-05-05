"use client";

import Link from "next/link";
import { AuthMarketingShell } from "@/components/auth/auth-marketing-shell";
import { useI18n } from "@/components/i18n-provider";

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  return (
    <AuthMarketingShell title={t("brand")} eyebrow={t("forgot_title")} backLabel={t("auth_back_home")}>
      <div className="rounded-[1.75rem] border border-stone-700/55 bg-stone-950/55 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl">
        <p className="text-sm leading-relaxed text-stone-300">{t("forgot_body")}</p>
        <div className="mt-5 grid gap-2">
          <Link
            href="/contact"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 active:scale-[0.99]"
          >
            {t("forgot_contact")}
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-stone-700 bg-stone-950/40 px-5 text-sm font-semibold text-stone-100 active:scale-[0.99]"
          >
            {t("forgot_back_login")}
          </Link>
        </div>
      </div>
    </AuthMarketingShell>
  );
}
