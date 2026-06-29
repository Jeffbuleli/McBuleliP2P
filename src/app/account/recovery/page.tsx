"use client";

import {
  AuthMarketingShell,
  AuthPageFooter,
  authTextMutedClass,
} from "@/components/auth/auth-marketing-shell";
import { AccountRecoveryForm } from "@/components/auth/account-recovery-form";
import { useI18n } from "@/components/i18n-provider";

export default function AccountRecoveryPage() {
  const { t } = useI18n();

  return (
    <AuthMarketingShell
      mode="recovery"
      footer={<AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />}
    >
      <p className={authTextMutedClass}>{t("recovery_sub")}</p>
      <div className="mt-5">
        <AccountRecoveryForm />
      </div>
    </AuthMarketingShell>
  );
}
