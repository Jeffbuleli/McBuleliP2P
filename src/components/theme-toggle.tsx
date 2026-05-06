"use client";

import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/components/i18n-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-stone-700/60 bg-stone-950/70 px-4 py-3 text-left shadow-lg shadow-black/25 backdrop-blur-md hover:bg-stone-900/60"
    >
      <span className="font-medium text-stone-100">{t("profile_theme")}</span>
      <span className="rounded-full border border-stone-700/60 bg-stone-900/70 px-3 py-1 text-sm font-semibold text-stone-200">
        {theme === "dark" ? t("profile_theme_dark") : t("profile_theme_light")}
      </span>
    </button>
  );
}
