"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

export function TradeSubNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isFutures = pathname.includes("/trade/futures");
  const isOptions = pathname.includes("/trade/options");

  const tab = (href: string, active: boolean, label: string) => (
    <Link
      href={href}
      prefetch
      className={`flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition ${
        active
          ? "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
          : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav
      className="sticky top-0 z-30 mb-4 flex gap-2 rounded-2xl border border-stone-200 bg-white/95 p-1 shadow-sm backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95"
      aria-label={t("trade_ui_tabs_aria")}
    >
      {tab("/app/trade/futures", isFutures, t("trade_ui_tab_futures"))}
      {tab("/app/trade/options", isOptions, t("trade_ui_tab_options"))}
    </nav>
  );
}
