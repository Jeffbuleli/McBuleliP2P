"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

export function PasskeyLoginButton({
  email,
  className,
}: {
  email?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onClick() {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      const optRes = await fetch("/api/auth/passkey/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email?.trim() ? { email: email.trim() } : {}),
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        setErr(clientErrorText(t, optData.error ?? "profile_invalid_input"));
        return;
      }

      const assertion = await startAuthentication({ optionsJSON: optData.options });
      const verifyRes = await fetch("/api/auth/passkey/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: optData.challengeId,
          response: assertion,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        setErr(clientErrorText(t, verifyData.error ?? "profile_invalid_input"));
        return;
      }
      window.location.replace("/app");
    } catch (e) {
      const msg = e instanceof Error ? e.message : null;
      setErr(msg ? `${t("auth_passkey_failed")}: ${msg}` : t("auth_passkey_failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        className={
          className ??
          "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-4 text-sm font-semibold text-[color:var(--fd-text)] disabled:opacity-60"
        }
      >
        {busy ? t("auth_passkey_signing") : t("auth_passkey_login")}
      </button>
      {err ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </p>
      ) : null}
    </div>
  );
}
