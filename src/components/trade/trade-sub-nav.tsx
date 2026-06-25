"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { TradeIconBadge, TradeIconBots, TradeIconFutures } from "@/components/trade/trade-icons";

export function TradeSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const marketPanel = searchParams.get("panel");
  const isMarket = pathname.startsWith("/app/market");
  const isFutures =
    pathname.includes("/trade/futures") || (isMarket && marketPanel === "futures");
  const isBots =
    pathname.includes("/trade/bots") || (isMarket && marketPanel === "bots");

  const tab = (
    href: string,
    active: boolean,
    label: string,
    icon: ReactNode,
    tone: "mint" | "primary",
  ) => (
    <Link
      href={href}
      prefetch
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition active:scale-[0.98] ${
        active
          ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-primary)] text-white shadow-md"
          : "border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)]"
      }`}
    >
      <TradeIconBadge tone={active ? "primary" : tone} size="lg">
        <span className={active ? "text-white" : "text-[color:var(--fd-primary)]"}>{icon}</span>
      </TradeIconBadge>
      <span className="text-xs font-extrabold">{label}</span>
    </Link>
  );

  return (
    <nav
      className="mb-3 grid grid-cols-2 gap-2"
      aria-label={t("trade_ui_tabs_aria")}
    >
      {tab(
        "/app/market?panel=futures",
        isFutures,
        t("trade_ui_tab_futures"),
        <TradeIconFutures className="h-5 w-5" />,
        "mint",
      )}
      {tab(
        "/app/market?panel=bots",
        isBots,
        t("trade_ui_tab_bots"),
        <TradeIconBots className="h-5 w-5" />,
        "mint",
      )}
    </nav>
  );
}
