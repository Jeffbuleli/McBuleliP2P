"use client";

import type { Locale } from "@/i18n/locale";
import { useI18n } from "@/components/i18n-provider";

export function LangSwitch() {
  const { locale, setLocale, t } = useI18n();

  function btn(target: Locale, flag: string, code: string) {
    const active = locale === target;
    return (
      <button
        type="button"
        onClick={() => setLocale(target)}
        title={code}
        className={`rounded-lg px-2 py-1 text-lg leading-none transition ${
          active
            ? "bg-emerald-800 text-white ring-2 ring-emerald-600"
            : "bg-white/90 text-stone-700 hover:bg-emerald-50"
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
      className="flex items-center gap-0.5 rounded-full border border-stone-200 bg-stone-50/95 p-0.5 shadow-sm backdrop-blur"
      role="group"
      aria-label={locale === "fr" ? "Langue" : "Language"}
    >
      {btn("en", "🇬🇧", t("lang_en"))}
      {btn("fr", "🇫🇷", t("lang_fr"))}
    </div>
  );
}
