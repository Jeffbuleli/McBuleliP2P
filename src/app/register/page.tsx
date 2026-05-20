"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";

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
    <AuthMarketingShell
      footer={
        <AuthPageFooter
          prefix={t("has_account")}
          linkHref="/login"
          linkLabel={t("home_login")}
        />
      }
    >
      {referralCode.trim() ? (
        <p className="mb-4 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-3 py-2 text-xs font-semibold text-[color:var(--fd-primary)]">
          {t("register_ref_active", { code: referralCode.trim().toUpperCase() })}
        </p>
      ) : null}

      <div className="fd-card mt-2 rounded-[1.75rem] p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className={authLabelClass}>
            {t("email")}
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authInputClass}
              placeholder="you@email.com"
            />
          </label>

          <label className={authLabelClass}>
            {t("register_country_label")}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={authInputClass}
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
            className="mt-1 min-h-[52px] rounded-2xl bg-[color:var(--fd-primary)] py-3 font-semibold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? t("registering") : t("register_btn")}
          </button>
        </form>
      </div>
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
