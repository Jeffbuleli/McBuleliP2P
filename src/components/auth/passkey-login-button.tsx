"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { authAltBtnPasskeyClass } from "@/components/auth/auth-marketing-shell";
import { clientErrorText } from "@/lib/client-error-text";
import { passkeyClientErrorText } from "@/lib/passkey-client-error";

function PasskeyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M7 11v1a5 5 0 0 0 10 0v-1" />
      <rect x="3" y="11" width="18" height="10" rx="2.5" />
    </svg>
  );
}

export function PasskeyLoginButton({
  email,
  redirectTo = "/app",
  className,
  polished = false,
  turnstileToken,
  disabled = false,
}: {
  email?: string;
  /** Post-login path (sanitized by caller). */
  redirectTo?: string;
  className?: string;
  polished?: boolean;
  turnstileToken?: string | null;
  disabled?: boolean;
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
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        setErr(clientErrorText(t, verifyData.error ?? "profile_invalid_input"));
        return;
      }
      window.location.replace(redirectTo);
    } catch (e) {
      setErr(passkeyClientErrorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  const defaultPolishedClass = authAltBtnPasskeyClass;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy || disabled}
        className={className ?? (polished ? defaultPolishedClass : undefined) ??
          "inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-4 text-sm font-semibold text-[color:var(--fd-text)] disabled:opacity-60"}
      >
        <PasskeyIcon className="h-5 w-5 shrink-0 text-[#305F33]" />
        <span>{busy ? t("auth_passkey_signing") : t("auth_passkey_login")}</span>
      </button>
      {err ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {err}
        </p>
      ) : null}
    </div>
  );
}
