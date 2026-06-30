"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { authInputClass, authLabelClass } from "@/components/auth/auth-marketing-shell";
import { clientErrorText } from "@/lib/client-error-text";

export function AccountRecoveryForm({
  backHref = "/login",
}: {
  backHref?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/recovery/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
        return;
      }
      setStep("verify");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/recovery/whatsapp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
        return;
      }
      router.replace("/app");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <p className="text-sm leading-relaxed text-[color:var(--fd-muted)]">{t("recovery_wa_hint")}</p>
      {step === "request" ? (
        <form onSubmit={(e) => void requestOtp(e)} className="space-y-3">
          <label className={authLabelClass}>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              autoComplete="email"
              required
            />
          </label>
          {err ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? t("recovery_sending") : t("recovery_send_otp")}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void verifyOtp(e)} className="space-y-3">
          <label className={authLabelClass}>
            {t("recovery_otp_label")}
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className={authInputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </label>
          <label className={authLabelClass}>
            {t("sec_new_password")}
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={authInputClass}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
          {err ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? t("recovery_verifying") : t("recovery_submit")}
          </button>
        </form>
      )}
      <Link
        href={backHref}
        className="block text-center text-xs font-semibold text-[color:var(--fd-muted)] underline-offset-4 hover:underline"
      >
        {t("forgot_back_login")}
      </Link>
    </section>
  );
}
