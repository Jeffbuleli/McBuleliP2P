"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { AuthMarketingShell } from "@/components/auth/auth-marketing-shell";
import { paymentIdFromPiSdk, piInit } from "@/lib/pi-browser";

const PI_AUTO_SESSION_KEY = "mcbuleli_pi_login_auto_fired_v1";

/** One in-flight Pi.authenticate at a time (avoids piBusy / SDK fighting). */
let piAuthInFlightGlobal = false;

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [piBusy, setPiBusy] = useState(false);

  const canAutoPi = useMemo(
    () => process.env.NEXT_PUBLIC_PI_AUTO_LOGIN === "1",
    [],
  );

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
      window.location.replace("/app");
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) &&
        err.name === "AbortError";
      setError(aborted ? t("auth_timeout") : t("auth_network_error"));
    } finally {
      setLoading(false);
    }
  }

  async function startPiAuth(opts?: { manual?: boolean }) {
    if (piAuthInFlightGlobal) return;
    piAuthInFlightGlobal = true;
    setError(null);
    setPiBusy(true);
    try {
      const Pi = await piInit();
      const authRes = (await Promise.resolve(
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
                body: JSON.stringify({ payment }),
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
      window.location.replace("/app");
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : null;
      setError(msg ? `Pi: ${msg}` : t("auth_pi_failed"));
    } finally {
      piAuthInFlightGlobal = false;
      setPiBusy(false);
    }
  }

  useEffect(() => {
    if (!canAutoPi) return;
    try {
      if (sessionStorage.getItem(PI_AUTO_SESSION_KEY) === "1") return;
      sessionStorage.setItem(PI_AUTO_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    queueMicrotask(() => {
      void startPiAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthMarketingShell title={t("brand")} eyebrow={t("login_title")} backLabel={t("auth_back_home")}>
      <div className="rounded-[1.75rem] border border-stone-700/55 bg-stone-950/55 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-stone-100">
            {t("email")}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-stone-700 bg-stone-950/40 px-3 py-3 text-base text-stone-50 outline-none ring-emerald-600/40 placeholder:text-stone-600 focus:ring-2"
              placeholder="you@email.com"
            />
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-stone-100">{t("password")}</label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-emerald-300/90 underline-offset-4 hover:text-emerald-200 hover:underline"
              >
                {t("login_forgot")}
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-stone-700 bg-stone-950/40 px-3 py-3 text-base text-stone-50 outline-none ring-emerald-600/40 placeholder:text-stone-600 focus:ring-2"
            />
          </div>
          {error ? (
            <p className="rounded-2xl border border-rose-900/40 bg-rose-950/35 px-3 py-2 text-sm text-rose-50">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 min-h-[52px] rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3 font-semibold text-white shadow-lg shadow-emerald-900/25 disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? t("signing") : t("signin")}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-stone-800" />
          </div>
          <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            <span className="bg-stone-950/40 px-3">{t("auth_or")}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={piBusy}
          onClick={() => void startPiAuth({ manual: true })}
          className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-stone-700 bg-stone-950/40 px-4 text-sm font-semibold text-stone-50 disabled:opacity-60"
        >
          {piBusy ? t("auth_pi_signing") : t("auth_pi_continue")}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-stone-400">
        {t("no_account")}{" "}
        <Link href="/register" className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline">
          {t("home_register")}
        </Link>
      </p>
    </AuthMarketingShell>
  );
}
