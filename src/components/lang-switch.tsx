"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";
import { ProfileIconFlagEn, ProfileIconFlagFr } from "@/components/icons/profile-icons";

export function LangSwitch({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useI18n();
  const dark = variant === "dark";

  function btn(target: Locale, flag: ReactNode, code: string) {
    const active = locale === target;
    return (
      <button
        type="button"
        onClick={() => setLocale(target)}
        title={code}
        className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 transition ${
          active
            ? dark
              ? "bg-emerald-500 text-stone-950 ring-2 ring-emerald-400/60"
              : "bg-[color:var(--fd-primary)] text-white ring-2 ring-[color:var(--fd-primary)]/30"
            : dark
              ? "bg-stone-800/90 text-stone-200 hover:bg-stone-700"
              : "border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint-deep)]"
        }`}
        aria-pressed={active}
      >
        <span aria-hidden>{flag}</span>
        <span className="sr-only">{code}</span>
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-full p-0.5 shadow-sm backdrop-blur ${
        dark
          ? "border border-stone-600/80 bg-stone-900/90"
          : "border border-[color:var(--fd-border)] bg-white/95"
      }`}
      role="group"
      aria-label={locale === "fr" ? "Langue" : "Language"}
    >
      {btn("en", <ProfileIconFlagEn />, t("lang_en"))}
      {btn("fr", <ProfileIconFlagFr />, t("lang_fr"))}
    </div>
  );
}
