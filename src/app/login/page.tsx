"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { safeAppRedirectPath } from "@/lib/safe-app-path";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";
import { AuthWaitingScreen } from "@/components/auth/auth-waiting-screen";
import { PasskeyLoginButton } from "@/components/auth/passkey-login-button";
import { paymentIdFromPiSdk, piInit, resolvePiSdkSandbox, isPiBrowser } from "@/lib/pi-browser";

const PI_AUTH_TIMEOUT_MS = 55_000;

/** One in-flight Pi.authenticate at a time (avoids piBusy / SDK fighting). */
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
    timeoutId = setTimeout(
      () => rej(new Error("pi_auth_timeout")),
      PI_AUTH_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([auth, timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

function LoginForm() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email")?.trim() ?? "";
  const nextPath = safeAppRedirectPath(searchParams.get("next"));
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [piBusy, setPiBusy] = useState(false);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session", { credentials: "same-origin" })
      .then((res) => {
        if (!cancelled && res.ok) {
          window.location.replace(nextPath);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithDeadline(
        "/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "same-origin",
        },
        28_000,
      );
      const text = await res.text().catch(() => "");
      const data = (() => {
        if (!text) return {};
        try {
          return JSON.parse(text) as unknown;
        } catch {
          return { detail: text.slice(0, 240) };
        }
      })();
      if (!res.ok) {
        const msg = formatAuthClientError(data);
        setError(msg === "Could not complete request." ? `HTTP ${res.status}` : msg);
        return;
      }
      // Full navigation so the session cookie is always sent on the next load (avoids stuck RSC shell).
      window.location.replace(nextPath);
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) &&
        err.name === "AbortError";
      setError(aborted ? t("auth_timeout") : t("auth_network_error"));
    } finally {
      setLoading(false);
    }
  }

  async function startPiAuth() {
    if (piAuthInFlightGlobal) return;
    piAuthInFlightGlobal = true;
    setError(null);
    setPiBusy(true);
    try {
      if (typeof window !== "undefined" && !window.Pi && !isPiBrowser()) {
        setError(t("auth_pi_browser_required"));
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
      )) as unknown as {
        accessToken?: string;
        user?: { username?: string };
        authResult?: { accessToken?: string };
      };

      const accessToken =
        authRes?.accessToken ??
        authRes?.authResult?.accessToken ??
        ((authRes as unknown as { access_token?: unknown })?.access_token as
          | string
          | undefined) ??
        "";

      if (!accessToken) {
        setError("Pi: missing access token");
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
        setError(formatAuthClientError(data));
        return;
      }
      window.location.replace(nextPath);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : null;
      if (msg === "pi_auth_timeout") {
        setError(t("auth_pi_timeout"));
      } else {
        setError(msg ? `Pi: ${msg}` : t("auth_pi_failed"));
      }
    } finally {
      piAuthInFlightGlobal = false;
      setPiBusy(false);
    }
  }

  if (loading || piBusy) {
    return (
      <AuthMarketingShell showBrandHeader={false}>
        <AuthWaitingScreen message={piBusy ? t("auth_pi_signing") : t("signing")} />
      </AuthMarketingShell>
    );
  }

  return (
    <AuthMarketingShell
      footer={
        <AuthPageFooter
          prefix={t("no_account")}
          linkHref={`/register?next=${encodeURIComponent(nextPath)}`}
          linkLabel={t("home_register")}
        />
      }
    >
      <div className="fd-card rounded-[1.75rem] p-5">
        <form onSubmit={onSubmit} className="auth-form flex flex-col gap-4">
          <label className={authLabelClass}>
            {t("email")}
            <input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              placeholder="you@email.com"
            />
          </label>
          <div className="auth-field flex flex-col gap-2">
            <div className="auth-field-header flex items-center justify-between gap-3">
              <span className="auth-label text-sm font-medium text-[color:var(--fd-text)]">
                {t("password")}
              </span>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
              >
                {t("login_forgot")}
              </Link>
            </div>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          <button type="submit" className="auth-btn-primary mt-1 min-h-[52px] rounded-2xl shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99]">
            {t("signin")}
          </button>
        </form>

        <div className="auth-divider relative my-6">
          <div className="auth-divider-line absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-[color:var(--fd-border)]" />
          </div>
          <div className="auth-divider-label relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--fd-muted)]">
            <span className="bg-[color:var(--fd-card)] px-3">{t("auth_or")}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void startPiAuth()}
          className="auth-btn-outline flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl px-4 disabled:opacity-60"
        >
          <span>{t("auth_pi_continue")}</span>
          <Image
            src="/assets/crypto/pi.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 rounded-full"
          />
        </button>

        <PasskeyLoginButton email={email} polished />

      </div>
    </AuthMarketingShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthMarketingShell showBrandHeader={false}>
          <AuthWaitingScreen />
        </AuthMarketingShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
