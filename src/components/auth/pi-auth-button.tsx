"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import {
  paymentIdFromPiSdk,
  piInit,
  resolvePiSdkSandbox,
  isPiBrowser,
} from "@/lib/pi-browser";

const PI_AUTH_TIMEOUT_MS = 55_000;
let piAuthInFlightGlobal = false;

async function piAuthenticateWithTimeout(
  Pi: NonNullable<Window["Pi"]>,
  onIncompletePayment: (payment: unknown) => Promise<void>,
): Promise<unknown> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const auth = Promise.resolve(
    Pi.authenticate(["username", "payments"], onIncompletePayment),
  );
  const timeout = new Promise<never>((_, rej) => {
    timeoutId = setTimeout(() => rej(new Error("pi_auth_timeout")), PI_AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([auth, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function PiAuthButton({
  redirectTo,
  onBusyChange,
  onError,
  className,
}: {
  redirectTo: string;
  onBusyChange?: (busy: boolean) => void;
  onError?: (message: string) => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function startPiAuth() {
    if (piAuthInFlightGlobal || busy) return;
    piAuthInFlightGlobal = true;
    setBusy(true);
    onBusyChange?.(true);
    onError?.("");
    try {
      if (typeof window !== "undefined" && !window.Pi && !isPiBrowser()) {
        onError?.(t("auth_pi_browser_required"));
        return;
      }
      const Pi = await piInit();
      const authRes = (await piAuthenticateWithTimeout(
        Pi,
        async (payment: unknown) => {
          const pid = paymentIdFromPiSdk(payment);
          if (!pid) return;
          const res = await fetchWithDeadline(
            "/api/payments/pi/incomplete",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payment, sandbox: resolvePiSdkSandbox() }),
              credentials: "same-origin",
            },
            45_000,
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(
              typeof data === "object" &&
                data !== null &&
                "message" in data &&
                typeof (data as { message: unknown }).message === "string"
                ? (data as { message: string }).message
                : "pi_incomplete_payment_failed",
            );
          }
        },
      )) as {
        accessToken?: string;
        authResult?: { accessToken?: string };
        access_token?: string;
      };

      const accessToken =
        authRes?.accessToken ??
        authRes?.authResult?.accessToken ??
        authRes?.access_token ??
        "";

      if (!accessToken) {
        onError?.("Pi: missing access token");
        return;
      }

      const res = await fetchWithDeadline(
        "/api/auth/pi",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
          credentials: "same-origin",
        },
        28_000,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError?.(formatAuthClientError(data));
        return;
      }
      window.location.replace(redirectTo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : null;
      if (msg === "pi_auth_timeout") {
        onError?.(t("auth_pi_timeout"));
      } else {
        onError?.(msg ? `Pi: ${msg}` : t("auth_pi_failed"));
      }
    } finally {
      piAuthInFlightGlobal = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startPiAuth()}
      disabled={busy}
      className={
        className ??
        "auth-btn-outline flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl px-4 disabled:opacity-60"
      }
    >
      <span>{busy ? t("auth_pi_signing") : t("auth_pi_continue")}</span>
      <Image
        src="/assets/crypto/pi.png"
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-full"
      />
    </button>
  );
}
