"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authBtnSecondaryClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authTextMutedClass,
} from "@/components/auth/auth-marketing-shell";
import { AuthTurnstileField, useAuthTurnstile } from "@/components/auth/auth-turnstile-field";
import { useI18n } from "@/components/i18n-provider";
import { AuthRecoveryAlternatives } from "@/components/auth/auth-recovery-alternatives";
import { clientErrorText } from "@/lib/client-error-text";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { turnstileToken, turnstileReady, onTurnstileToken, onTurnstileExpire } =
    useAuthTurnstile();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? data.message ?? "profile_invalid_input"));
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell
      mode="forgot"
      footer={<AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />}
    >
      <p className={authTextMutedClass}>{sent ? t("forgot_sent") : t("forgot_body_new")}</p>
      {!sent ? (
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form mt-5 space-y-4">
          <AuthTurnstileField onToken={onTurnstileToken} onExpire={onTurnstileExpire} />
          <label className={authLabelClass}>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              required
              autoComplete="email"
            />
          </label>
          {err ? <p className={authErrorClass}>{err}</p> : null}
          <button
            type="submit"
            disabled={loading || !turnstileReady}
            className="auth-btn-primary min-h-[52px] rounded-xl active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? t("forgot_sending") : t("forgot_submit")}
          </button>
          <AuthRecoveryAlternatives variant="dark" />
        </form>
      ) : (
        <div className="mt-5 space-y-4">
          <Link href="/login" className={authBtnSecondaryClass}>
            {t("forgot_back_login")}
          </Link>
          <AuthRecoveryAlternatives variant="dark" />
        </div>
      )}
    </AuthMarketingShell>
  );
}
