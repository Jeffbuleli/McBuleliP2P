"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

export function TradeSubNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isFutures = pathname.includes("/trade/futures");
  const isBots = pathname.includes("/trade/bots");

  const tab = (href: string, active: boolean, label: string, icon: string) => (
    <Link
      href={href}
      prefetch
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
        active
          ? "bg-[color:var(--fd-primary)] text-white shadow-sm"
          : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]"
      }`}
    >
      <span className="text-base leading-none" aria-hidden>
        {icon}
      </span>
      {label}
    </Link>
  );

  return (
    <nav
      className="fd-card mb-3 flex gap-1 p-1"
      aria-label={t("trade_ui_tabs_aria")}
    >
      {tab("/app/trade/bots", isBots, t("trade_ui_tab_bots"), "🤖")}
      {tab("/app/trade/futures", isFutures, t("trade_ui_tab_futures"), "📈")}
    </nav>
  );
}
