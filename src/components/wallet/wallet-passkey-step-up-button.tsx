"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import { passkeyClientErrorText } from "@/lib/passkey-client-error";

type Props = {
  verified: boolean;
  onVerified: () => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

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

/** Passkey (fingerprint / Face ID) step-up before confirming a wallet transaction. */
export function WalletPasskeyStepUpButton({
  verified,
  onVerified,
  onError,
  disabled = false,
}: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy || disabled || verified) return;
    setBusy(true);
    try {
      const optRes = await fetch("/api/auth/passkey/step-up", { method: "POST" });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) {
        const msg = clientErrorText(t, optData.error ?? "profile_invalid_input");
        onError?.(msg);
        return;
      }

      const assertion = await startAuthentication({ optionsJSON: optData.options });
      const verifyRes = await fetch("/api/auth/passkey/step-up", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: optData.challengeId,
          response: assertion,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) {
        const msg = clientErrorText(t, verifyData.error ?? "profile_invalid_input");
        onError?.(msg);
        return;
      }
      onVerified();
    } catch (e) {
      onError?.(passkeyClientErrorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <p className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-900">
        <PasskeyIcon className="h-5 w-5 shrink-0" />
        {t("withdraw_passkey_validated")}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={busy || disabled}
      className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[color:var(--fd-primary)]/25 bg-gradient-to-r from-white to-[color:var(--fd-mint)] px-4 text-sm font-bold text-[color:var(--fd-primary)] shadow-sm disabled:opacity-50"
    >
      <PasskeyIcon className="h-5 w-5 shrink-0" />
      {busy ? t("auth_passkey_signing") : t("withdraw_passkey_validate")}
    </button>
  );
}
