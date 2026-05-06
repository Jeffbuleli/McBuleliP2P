"use client";

import Link from "next/link";
import { useState } from "react";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { AuthMarketingShell } from "@/components/auth/auth-marketing-shell";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(formatAuthClientError(data));
        return;
      }
      // Full navigation so the session cookie is always sent on the next load (avoids stuck RSC shell).
      window.location.assign("/app");
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      setError(aborted ? t("auth_timeout") : t("auth_network_error"));
    } finally {
      setLoading(false);
    }
  }

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
          disabled
          className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-stone-700 bg-white px-4 text-sm font-semibold text-stone-900 opacity-70"
          title={t("auth_google_soon")}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.7 33.9 29.3 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.4 1.2 8.8 3.2l5.7-5.7C34.9 5.6 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-4z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 16.4 18.9 13 24 13c3.3 0 6.4 1.2 8.8 3.2l5.7-5.7C34.9 5.6 29.7 3 24 3 16.3 3 9.6 7.8 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 45c5.6 0 10.7-2.1 14.6-5.5l-6.8-5.7c-2 1.4-4.6 2.2-7.8 2.2-5.3 0-9.8-3.1-11.7-7.5l-6.8 5.2C9.7 40.7 16.3 45 24 45z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-1 3-3.2 5.5-6.3 7.2l.1-.1 6.8 5.7h.1c4.4-4.1 7-10 7-16.6 0-1.4-.1-2.7-.4-4z"
              />
            </svg>
          </span>
          {t("auth_google")}
        </button>
        <p className="mt-3 text-center text-[11px] leading-snug text-stone-500">{t("auth_google_soon")}</p>
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
