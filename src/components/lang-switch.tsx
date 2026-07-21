"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";
import { ProfileIconFlagEn, ProfileIconFlagFr } from "@/components/icons/profile-icons";

export function LangSwitch({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useI18n();
  const dark = variant === "dark";
  const enActive = locale === "en";

  function btn(target: Locale, flag: ReactNode, code: string) {
    const active = locale === target;
    return (
      <button
        type="button"
        onClick={() => {
          if (locale === target) return;
          setLocale(target);
        }}
        title={code}
        className={`relative z-10 flex items-center justify-center rounded-full px-2.5 py-1.5 transition-all duration-200 ease-out ${
          active
            ? dark
              ? "text-stone-950"
              : "text-white"
            : dark
              ? "text-stone-300 hover:text-white"
              : "text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint)]/80"
        }`}
        aria-pressed={active}
      >
        <span
          className={`inline-flex transition-transform duration-200 ease-out ${
            active ? "scale-110" : "scale-100 opacity-80"
          }`}
          aria-hidden
        >
          {flag}
        </span>
        <span className="sr-only">{code}</span>
      </button>
    );
  }

  return (
    <div
      className={`relative flex items-center gap-0.5 rounded-full p-0.5 shadow-sm backdrop-blur ${
        dark
          ? "border border-stone-600/80 bg-stone-900/90"
          : "border border-[color:var(--fd-border)] bg-white/95"
      }`}
      role="group"
      aria-label={locale === "fr" ? "Langue" : "Language"}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full shadow-sm transition-all duration-300 ease-out ${
          dark ? "bg-emerald-500" : "bg-[color:var(--fd-primary)]"
        } ${enActive ? "left-0.5" : "left-[calc(50%+1px)]"}`}
      />
      {btn("en", <ProfileIconFlagEn />, t("lang_en"))}
      {btn("fr", <ProfileIconFlagFr />, t("lang_fr"))}
    </div>
  );
}
