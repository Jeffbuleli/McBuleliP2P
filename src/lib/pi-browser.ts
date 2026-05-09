/** Browser-only Pi SDK helpers (load script + init). Import only from client components. */

import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

/** Pi payment object shape from the SDK (identifier is the platform payment id). */
export function paymentIdFromPiSdk(payment: unknown): string | null {
  if (!payment || typeof payment !== "object") return null;
  const id = (payment as { identifier?: unknown }).identifier;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * `Pi.createPayment` requires the `payments` scope. That scope is granted by
 * `Pi.authenticate(["username", "payments"], ...)`. Email/password sessions do
 * not grant it — call this before `createPayment` (e.g. on the wallet page).
 */
export async function piAuthenticateForPayments(
  Pi: NonNullable<Window["Pi"]>,
): Promise<void> {
  await Promise.resolve(
    Pi.authenticate(
      ["username", "payments"],
      async (payment: unknown) => {
        const pid = paymentIdFromPiSdk(payment);
        if (!pid) return;
        const res = await fetchWithDeadline(
          "/api/payments/pi/incomplete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment,
              sandbox: resolvePiSdkSandbox(),
            }),
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
    ),
  );
}

export function loadPiSdk(): Promise<NonNullable<Window["Pi"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no_window"));
  }
  if (window.Pi) return Promise.resolve(window.Pi);

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-pi-sdk="1"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (window.Pi) resolve(window.Pi);
        else setTimeout(check, 25);
      };
      const t = window.setTimeout(() => reject(new Error("pi_sdk_timeout")), 8000);
      check();
      existing.addEventListener(
        "load",
        () => {
          window.clearTimeout(t);
          if (window.Pi) resolve(window.Pi);
          else reject(new Error("pi_sdk_load_failed"));
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("pi_sdk_error")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.dataset.piSdk = "1";
    s.src = "https://sdk.minepi.com/pi-sdk.js";
    s.async = true;
    s.onload = () => {
      if (window.Pi) resolve(window.Pi);
      else reject(new Error("pi_sdk_load_failed"));
    };
    s.onerror = () => reject(new Error("pi_sdk_error"));
    document.head.appendChild(s);
  });
}

/**
 * Pi SDK `sandbox` flag must match the environment where the page runs.
 * Pi Developer / Pi Browser opens many apps at `sandbox.minepi.com/...` — if
 * we init with `sandbox: false` there, `Pi.authenticate` often hangs or fails.
 *
 * Explicit env wins: `NEXT_PUBLIC_PI_SANDBOX=0` forces production init even on
 * sandbox host (rare); `1` forces sandbox everywhere (e.g. prod domain + testnet).
 */
export function resolvePiSdkSandbox(): boolean {
  if (process.env.NEXT_PUBLIC_PI_SANDBOX === "0") {
    return false;
  }
  if (process.env.NEXT_PUBLIC_PI_SANDBOX === "1") {
    return true;
  }
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "sandbox.minepi.com") {
      return true;
    }
  }
  return false;
}

export async function piInit(): Promise<NonNullable<Window["Pi"]>> {
  const Pi = await loadPiSdk();
  await Promise.resolve(
    Pi.init({
      version: "2.0",
      sandbox: resolvePiSdkSandbox(),
    }),
  );
  return Pi;
}
