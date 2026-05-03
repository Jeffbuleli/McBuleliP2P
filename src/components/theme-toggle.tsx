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
      className="flex min-h-[48px] w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 text-left dark:border-stone-700 dark:bg-stone-900"
    >
      <span className="font-medium text-stone-900 dark:text-stone-100">
        {t("profile_theme")}
      </span>
      <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
        {theme === "dark" ? t("profile_theme_dark") : t("profile_theme_light")}
      </span>
    </button>
  );
}
