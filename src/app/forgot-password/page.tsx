"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";
import { useI18n } from "@/components/i18n-provider";
import { AuthRecoveryAlternatives } from "@/components/auth/auth-recovery-alternatives";
import { clientErrorText } from "@/lib/client-error-text";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5">
        <h1 className="text-lg font-bold text-[color:var(--fd-text)]">{t("forgot_title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {sent ? t("forgot_sent") : t("forgot_body_new")}
        </p>
        {!sent ? (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
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
            {err ? <p className="text-xs text-red-600">{err}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? t("forgot_sending") : t("forgot_submit")}
            </button>
            <AuthRecoveryAlternatives />
          </form>
        ) : (
          <>
            <Link
              href="/login"
              className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-5 text-sm font-semibold text-[color:var(--fd-text)]"
            >
              {t("forgot_back_login")}
            </Link>
            <AuthRecoveryAlternatives />
          </>
        )}
      </div>
    </AuthMarketingShell>
  );
}
