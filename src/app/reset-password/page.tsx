"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";
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
      footer={
        <AuthPageFooter linkHref="/login" linkLabel={t("forgot_back_login")} />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5">
        <h1 className="text-lg font-bold">{t("reset_title")}</h1>
        <p className="mt-2 text-sm text-[color:var(--fd-muted)]">{t("reset_sub")}</p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
          <label className={authLabelClass}>
            {t("sec_new_password")}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
              minLength={8}
              required
            />
          </label>
          {err ? <p className="text-xs text-red-600">{err}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? t("reset_saving") : t("reset_submit")}
          </button>
        </form>
        <Link href="/login" className="mt-3 block text-center text-xs text-[color:var(--fd-muted)]">
          {t("forgot_back_login")}
        </Link>
      </div>
    </AuthMarketingShell>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">{t("sec_loading")}</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
