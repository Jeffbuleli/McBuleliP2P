"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatAuthClientError } from "@/lib/format-auth-client-error";
import { useI18n } from "@/components/i18n-provider";
import { countryLabel } from "@/lib/country-label";
import {
  AuthMarketingShell,
  AuthPageFooter,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";
import { AuthWaitingScreen } from "@/components/auth/auth-waiting-screen";

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
  const [displayName, setDisplayName] = useState("");
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
            displayName: displayName.trim(),
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
        const errObj = data as { error?: string };
        if (errObj.error === "profile_pseudo_taken") {
          setError(t("profile_pseudo_taken"));
        } else {
          setError(formatAuthClientError(data));
        }
        setLoading(false);
        return;
      }
      window.location.replace("/app");
    } catch (err) {
      const aborted =
        (err instanceof DOMException || err instanceof Error) &&
        err.name === "AbortError";
      setError(aborted ? t("auth_timeout") : t("auth_network_error"));
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AuthMarketingShell showBrandHeader={false}>
        <AuthWaitingScreen message={t("registering")} />
      </AuthMarketingShell>
    );
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
        <p className="mb-3 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] px-3 py-2 text-center text-xs font-bold text-[color:var(--fd-primary)]">
          {t("register_ref_active", { code: referralCode.trim().toUpperCase() })}
        </p>
      ) : null}

      <div className="fd-card rounded-[1.75rem] p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
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

          <label className={authLabelClass}>
            {t("register_display_name")}
            <input
              type="text"
              name="displayName"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={32}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={authInputClass}
              placeholder={t("register_display_name_ph")}
            />
          </label>

          <label className={authLabelClass}>
            {t("register_country_label")}
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={authInputClass}
              autoComplete="country"
            >
              <option value="">{t("register_country_ph")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryLabel(locale, c.code)}
                </option>
              ))}
            </select>
          </label>

          <label className={authLabelClass}>
            {t("password")}
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </label>

          <label className={authLabelClass}>
            {t("register_ref_label")}
            <input
              type="text"
              name="referral"
              inputMode="text"
              autoComplete="off"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder={t("register_ref_ph")}
              className={authInputClass}
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-1 min-h-[52px] rounded-2xl bg-[color:var(--fd-primary)] py-3 text-base font-bold text-white shadow-lg shadow-[color:var(--fd-primary)]/20 active:scale-[0.99]"
          >
            {t("register_btn")}
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
        <AuthMarketingShell showBrandHeader={false}>
          <AuthWaitingScreen />
        </AuthMarketingShell>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
