"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { ProfileSubpageHeader } from "@/components/profile/profile-subpage-header";
import {
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";
import { clientErrorText } from "@/lib/client-error-text";

export default function AccountRecoveryPage() {
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
      router.replace("/app/wallet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-theme profile-scroll -mx-4 min-h-[calc(100dvh-6.5rem)] px-4 pb-4">
      <ProfileSubpageHeader title={t("recovery_title")} subtitle={t("recovery_sub")} />
      <section className="fd-card space-y-3 p-4">
        <p className="text-xs text-[color:var(--fd-muted)]">{t("recovery_wa_hint")}</p>
        {step === "request" ? (
          <form onSubmit={(e) => void requestOtp(e)} className="space-y-3">
            <label className={authLabelClass}>
              {t("email")}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
                required
              />
            </label>
            {err ? <p className="text-xs text-red-600">{err}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60"
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
                required
              />
            </label>
            {err ? <p className="text-xs text-red-600">{err}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? t("recovery_verifying") : t("recovery_submit")}
            </button>
          </form>
        )}
        <Link href="/login" className="block text-center text-xs text-[color:var(--fd-muted)]">
          {t("forgot_back_login")}
        </Link>
      </section>
    </div>
  );
}
