"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  AuthMarketingShell,
  AuthPageFooter,
} from "@/components/auth/auth-marketing-shell";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

function ConfirmEmailChangeInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setErr(t("verify_missing_token"));
      return;
    }
    void fetch("/api/account/confirm-email-change", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("err");
          setErr(clientErrorText(t, data.error ?? "profile_invalid_input"));
          return;
        }
        setStatus("ok");
        setTimeout(() => router.replace("/app/profile/security"), 1500);
      })
      .catch(() => {
        setStatus("err");
        setErr(t("auth_network_error"));
      });
  }, [token, t, router]);

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter linkHref="/app/profile/security" linkLabel={t("profile_security")} />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5 text-center">
        <h1 className="text-lg font-bold">{t("confirm_email_title")}</h1>
        {status === "idle" ? (
          <p className="mt-3 text-sm text-[color:var(--fd-muted)]">{t("verify_working")}</p>
        ) : null}
        {status === "ok" ? (
          <p className="mt-3 text-sm text-emerald-700">{t("confirm_email_ok")}</p>
        ) : null}
        {status === "err" ? (
          <>
            <p className="mt-3 text-sm text-red-600">{err}</p>
            <Link
              href="/app/profile/security"
              className="mt-4 inline-block text-sm font-semibold text-[color:var(--fd-primary)]"
            >
              {t("profile_security")}
            </Link>
          </>
        ) : null}
      </div>
    </AuthMarketingShell>
  );
}

export default function ConfirmEmailChangePage() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">{t("sec_loading")}</p>}>
      <ConfirmEmailChangeInner />
    </Suspense>
  );
}
