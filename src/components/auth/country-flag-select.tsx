"use client";

import { useMemo } from "react";
import type { Locale } from "@/i18n/locale";
import { countryLabel, flagEmoji } from "@/lib/country-label";
import { authInputClass } from "@/components/auth/auth-marketing-shell";

type CountryOption = { code: string; en: string; fr: string };

export function CountryFlagSelect({
  locale,
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  locale: Locale;
  value: string;
  onChange: (code: string) => void;
  options: readonly CountryOption[];
  placeholder: string;
  label: string;
}) {
  const sorted = useMemo(() => {
    return [...options].sort((a, b) => {
      const la = locale === "fr" ? a.fr : a.en;
      const lb = locale === "fr" ? b.fr : b.en;
      return la.localeCompare(lb);
    });
  }, [locale, options]);

  return (
    <label className="auth-label auth-field flex flex-col gap-1">
      {label}
      <div className="relative">
        {value ? (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base"
            aria-hidden
          >
            {value === "OTHER" ? "🏳️" : flagEmoji(value)}
          </span>
        ) : null}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${authInputClass} ${value ? "pl-10" : ""}`}
          autoComplete="country"
        >
          <option value="">{placeholder}</option>
          {sorted.map((c) => (
            <option key={c.code} value={c.code}>
              {countryLabel(locale, c.code)}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
