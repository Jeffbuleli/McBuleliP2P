"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
} from "@/components/auth/auth-marketing-shell";
import { useI18n } from "@/components/i18n-provider";

/**
 * Shown after signup / login when email is not verified yet.
 * Blocks access to /app until the user confirms the email.
 */
export default function VerifyEmailPendingPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          user?: { email?: string; emailVerified?: boolean } | null;
        };
        if (cancelled) return;
        if (!data.ok || !data.user) {
          window.location.replace("/login");
          return;
        }
        if (data.user.emailVerified) {
          window.location.replace("/app");
          return;
        }
        setEmail(data.user.email ?? null);
      })
      .catch(() => {
        if (!cancelled) window.location.replace("/login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resend = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          typeof data.error === "string"
            ? data.error
            : t("auth_network_error"),
        );
        return;
      }
      if (data.alreadyVerified) {
        window.location.replace("/app");
        return;
      }
      setMsg(t("sec_email_sent"));
    } catch {
      setErr(t("auth_network_error"));
    } finally {
      setBusy(false);
    }
  }, [t]);

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).catch(() => null);
    window.location.replace("/login");
  }

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />
      }
    >
      <div className="fd-card space-y-4 rounded-[1.75rem] p-5 text-center">
        <h1 className="text-lg font-bold text-[color:var(--fd-text)]">
          {t("verify_pending_title")}
        </h1>
        <p className="text-sm text-[color:var(--fd-muted)]">
          {t("verify_pending_body")}
        </p>
        {email ? (
          <p className="break-all text-sm font-semibold text-[color:var(--fd-text)]">
            {email}
          </p>
        ) : null}
        {msg ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {msg}
          </p>
        ) : null}
        {err ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {err}
          </p>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void resend()}
          className="auth-btn-primary mt-1 min-h-[48px] w-full rounded-2xl disabled:opacity-60"
        >
          {busy ? t("sec_loading") : t("sec_resend_verify")}
        </button>
        <p className="text-xs text-[color:var(--fd-muted)]">
          {t("verify_pending_hint")}
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-xs font-semibold text-[color:var(--fd-muted)] underline-offset-2 hover:underline"
        >
          {t("log_out")}
        </button>
        <Link
          href="/verify-email"
          className="block text-xs text-[color:var(--fd-muted)]"
        >
          {t("verify_pending_has_link")}
        </Link>
      </div>
    </AuthMarketingShell>
  );
}
