"use client";

import {
  AuthMarketingShell,
  AuthPageFooter,
} from "@/components/auth/auth-marketing-shell";
import { AccountRecoveryForm } from "@/components/auth/account-recovery-form";
import { useI18n } from "@/components/i18n-provider";

export default function AccountRecoveryPage() {
  const { t } = useI18n();

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5">
        <h1 className="text-lg font-bold text-[color:var(--fd-text)]">{t("recovery_title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {t("recovery_sub")}
        </p>
        <div className="mt-5">
          <AccountRecoveryForm />
        </div>
      </div>
    </AuthMarketingShell>
  );
}
