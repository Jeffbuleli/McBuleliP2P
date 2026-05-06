"use client";

import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";

export function LangSwitch({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { locale, setLocale, t } = useI18n();
  const dark = variant === "dark";

  function btn(target: Locale, flag: string, code: string) {
    const active = locale === target;
    return (
      <button
        type="button"
        onClick={() => setLocale(target)}
        title={code}
        className={`rounded-lg px-2 py-1 text-lg leading-none transition ${
          active
            ? dark
              ? "bg-emerald-500 text-stone-950 ring-2 ring-emerald-400/60"
              : "bg-emerald-800 text-white ring-2 ring-emerald-600"
            : dark
              ? "bg-stone-800/90 text-stone-200 hover:bg-stone-700"
              : "bg-stone-950/70 text-stone-200 hover:bg-stone-900/70 border border-stone-700/60"
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
          : "border border-stone-700/60 bg-stone-950/70"
      }`}
      role="group"
      aria-label={locale === "fr" ? "Langue" : "Language"}
    >
      {btn("en", "🇬🇧", t("lang_en"))}
      {btn("fr", "🇫🇷", t("lang_fr"))}
    </div>
  );
}
