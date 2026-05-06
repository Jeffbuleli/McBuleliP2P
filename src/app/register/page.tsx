"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { AuthMarketingShell } from "@/components/auth/auth-marketing-shell";

const COUNTRY_OPTIONS = [
  { code: "CD", en: "DR Congo", fr: "RDC" },
  { code: "CG", en: "Republic of the Congo", fr: "Congo-Brazzaville" },
  { code: "GA", en: "Gabon", fr: "Gabon" },
  { code: "CM", en: "Cameroon", fr: "Cameroun" },
  { code: "CI", en: "Côte d’Ivoire", fr: "Côte d’Ivoire" },
  { code: "SN", en: "Senegal", fr: "Sénégal" },
  { code: "ML", en: "Mali", fr: "Mali" },
  { code: "BF", en: "Burkina Faso", fr: "Burkina Faso" },
  { code: "NE", en: "Niger", fr: "Niger" },
  { code: "NG", en: "Nigeria", fr: "Nigeria" },
  { code: "GH", en: "Ghana", fr: "Ghana" },
  { code: "KE", en: "Kenya", fr: "Kenya" },
  { code: "RW", en: "Rwanda", fr: "Rwanda" },
  { code: "UG", en: "Uganda", fr: "Ouganda" },
  { code: "ZA", en: "South Africa", fr: "Afrique du Sud" },
  { code: "OTHER", en: "Other", fr: "Autre" },
] as const;

function RegisterForm() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref")?.trim() ?? "";
  const initialReferralCode = refParam ? refParam.toUpperCase() : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const countries = useMemo(() => {
    return [...COUNTRY_OPTIONS].sort((a, b) => {
      const la = locale === "fr" ? a.fr : a.en;
      const lb = locale === "fr" ? b.fr : b.en;
      return la.localeCompare(lb);
    });
  }, [locale]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetchWithDeadline(
        "/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            ...(countryCode.trim() ? { countryCode: countryCode.trim().toUpperCase() } : {}),
            ...(referralCode.trim()
              ? { referralCode: referralCode.trim().toUpperCase() }
              : {}),
          }),
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
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) &&
        err.name === "AbortError";
      setError(aborted ? t("auth_timeout") : t("auth_network_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthMarketingShell title={t("brand")} eyebrow={t("register_title")} backLabel={t("auth_back_home")}>
      <p className="text-sm leading-relaxed text-stone-400">{t("register_sub")}</p>
      {referralCode.trim() ? (
        <p className="mt-4 rounded-2xl border border-emerald-900/35 bg-emerald-950/25 px-3 py-2 text-xs font-semibold text-emerald-100">
          {t("register_ref_active", { code: referralCode.trim().toUpperCase() })}
        </p>
      ) : null}

      <div className="mt-6 rounded-[1.75rem] border border-stone-700/55 bg-stone-950/55 p-5 shadow-2xl shadow-black/45 backdrop-blur-xl">
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

          <label className="flex flex-col gap-1 text-sm font-medium text-stone-100">
            {t("register_country_label")}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="rounded-2xl border border-stone-700 bg-stone-950/40 px-3 py-3 text-base text-stone-50 outline-none ring-emerald-600/40 focus:ring-2"
            >
              <option value="">{t("register_country_ph")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {locale === "fr" ? c.fr : c.en}
                </option>
              ))}
            </select>
            <span className="text-xs font-normal text-stone-500">{t("register_country_help")}</span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-stone-100">
            {t("password")}
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-stone-700 bg-stone-950/40 px-3 py-3 text-base text-stone-50 outline-none ring-emerald-600/40 focus:ring-2"
            />
            <span className="text-xs font-normal text-stone-500">{t("register_password_hint")}</span>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-stone-100">
            {t("register_ref_label")}
            <input
              type="text"
              inputMode="text"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder={t("register_ref_ph")}
              className="rounded-2xl border border-stone-700 bg-stone-950/40 px-3 py-3 text-base text-stone-50 outline-none ring-emerald-600/40 focus:ring-2"
            />
            <span className="text-xs font-normal text-stone-500">{t("register_ref_help")}</span>
          </label>

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
            {loading ? t("registering") : t("register_btn")}
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
        {t("has_account")}{" "}
        <Link href="/login" className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline">
          {t("home_login")}
        </Link>
      </p>
    </AuthMarketingShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-full max-w-md animate-pulse space-y-4 px-4 pb-10 pt-14">
          <div className="h-11 w-11 rounded-2xl bg-stone-200 dark:bg-stone-800" />
          <div className="h-8 w-48 rounded-lg bg-stone-200 dark:bg-stone-800" />
          <div className="h-4 w-full rounded bg-stone-200 dark:bg-stone-800" />
          <div className="mt-8 h-11 w-full rounded-xl bg-stone-200 dark:bg-stone-800" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
