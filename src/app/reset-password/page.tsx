"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkMutedClass,
  authTextMutedClass,
} from "@/components/auth/auth-marketing-shell";
import { AuthWaitingScreen } from "@/components/auth/auth-waiting-screen";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setErr(t("reset_missing_token"));
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
        return;
      }
      router.replace("/app/wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell
      mode="reset"
      footer={<AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />}
    >
      <p className={authTextMutedClass}>{t("reset_sub")}</p>
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form mt-5 space-y-4">
        <label className={authLabelClass}>
          {t("sec_new_password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {err ? <p className={authErrorClass}>{err}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary min-h-[52px] rounded-xl active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? t("reset_saving") : t("reset_submit")}
        </button>
      </form>
      <Link href="/login" className={`mt-4 block text-center ${authLinkMutedClass}`}>
        {t("forgot_back_login")}
      </Link>
    </AuthMarketingShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthMarketingShell showBrandHeader={false} mode="reset">
          <AuthWaitingScreen />
        </AuthMarketingShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
