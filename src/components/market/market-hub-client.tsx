"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useCallback, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { MarketPreview } from "@/components/mobile/market-preview";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { BotsDisclaimerStrip } from "@/components/trade/bots-page-chrome";
import type { MarketTicker } from "@/lib/market-tickers";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { TradeIconBots, TradeIconFutures } from "@/components/trade/trade-icons";
import {
  MARKET_CTA_LINK,
  MARKET_HUD_CARD,
  MARKET_SUBTITLE,
  MARKET_TAB_BTN,
  MARKET_TAB_BTN_ACTIVE,
  MARKET_TAB_NAV,
  MARKET_TITLE,
} from "@/lib/market/market-ui";

export type MarketHubPanel = "quotes" | "futures" | "bots";

const FuturesTradingClient = dynamic(
  () =>
    import("@/components/trade/futures-trading-client").then(
      (m) => m.FuturesTradingClient,
    ),
  {
    loading: () => <PanelSkeleton />,
  },
);

const BotsTradingClient = dynamic(
  () =>
    import("@/components/trade/bots-trading-client").then(
      (m) => m.BotsTradingClient,
    ),
  {
    loading: () => <PanelSkeleton />,
  },
);

function PanelSkeleton() {
  return (
    <div className="space-y-3 pt-2 animate-pulse" aria-busy>
      <div className={`${MARKET_HUD_CARD} h-10`} />
      <div className={`${MARKET_HUD_CARD} h-32`} />
      <div className={`${MARKET_HUD_CARD} h-48`} />
    </div>
  );
}

function MarketHubInner({
  locale,
  initialTickers,
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
}) {
  const { t } = useI18n();
  const d = getDictionary(locale);
  const router = useRouter();
  const searchParams = useSearchParams();

  const panel = useMemo((): MarketHubPanel => {
    const p = searchParams.get("panel");
    if (p === "futures" || p === "bots") return p;
    return "quotes";
  }, [searchParams]);

  const setPanel = useCallback(
    (next: MarketHubPanel) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next === "quotes") q.delete("panel");
      else q.set("panel", next);
      const qs = q.toString();
      router.replace(qs ? `/app/market?${qs}` : "/app/market", { scroll: false });
    },
    [router, searchParams],
  );

  const tabs: {
    id: MarketHubPanel;
    label: string;
    icon: ReactNode;
  }[] = [
    {
      id: "quotes",
      label: t("market_tab_quotes"),
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 19V5M10 19V9M16 19V13M22 19V7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "futures",
      label: t("trade_ui_tab_futures"),
      icon: <TradeIconFutures className="h-4 w-4" />,
    },
    {
      id: "bots",
      label: t("trade_ui_tab_bots"),
      icon: <TradeIconBots className="h-4 w-4" />,
    },
  ];

  const panelThemeClass =
    panel === "bots"
      ? "trade-bots-theme market-panel-shell -mx-4 rounded-t-3xl px-4 pb-4 pt-3"
      : panel === "futures"
        ? "trade-futures-theme market-panel-shell -mx-4 rounded-t-3xl px-4 pb-4 pt-3"
        : "";

  return (
    <div className="flex flex-col gap-3 pb-2">
      <header className="px-0.5">
        <h1 className={MARKET_TITLE}>{t("market_hub_title")}</h1>
        <p className={MARKET_SUBTITLE}>
          {panel === "quotes"
            ? d.market_live_hint
            : panel === "futures"
              ? t("market_hub_futures_hint")
              : t("market_hub_bots_hint")}
        </p>
      </header>

      {panel === "quotes" ? (
        <PriceChartLazy appearance="hud" deferUntilVisible density="default" />
      ) : null}

      <nav className={MARKET_TAB_NAV} aria-label={t("market_hub_title")}>
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const on = panel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                aria-current={on ? "page" : undefined}
                className={on ? MARKET_TAB_BTN_ACTIVE : MARKET_TAB_BTN}
              >
                <span>{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {panel === "quotes" ? (
        <>
          <MarketPreview
            locale={locale}
            initialTickers={initialTickers}
            showViewLink={false}
            appearance="hud"
            layout="cards"
          />
          <p className="text-center text-[11px] text-stone-500">
            {t("market_hub_trade_cta")}{" "}
            <button
              type="button"
              className={MARKET_CTA_LINK}
              onClick={() => setPanel("futures")}
            >
              {t("trade_ui_tab_futures")}
            </button>
            {" · "}
            <button
              type="button"
              className={MARKET_CTA_LINK}
              onClick={() => setPanel("bots")}
            >
              {t("trade_ui_tab_bots")}
            </button>
          </p>
        </>
      ) : (
        <div className={panelThemeClass}>
          {panel === "futures" ? (
            <FuturesTradingClient embedInMarketHub />
          ) : (
            <>
              <BotsTradingClient />
              <BotsDisclaimerStrip
                labels={{
                  aria: d.bots_disclaimer_aria,
                  orders: d.bots_disclaimer_orders,
                  custody: d.bots_disclaimer_custody,
                  nfa: d.bots_disclaimer_nfa,
                  ordersShort: d.bots_disclaimer_orders_short,
                  custodyShort: d.bots_disclaimer_custody_short,
                  nfaShort: d.bots_disclaimer_nfa_short,
                }}
              />
            </>
          )}
        </div>
      )}

      {panel !== "quotes" ? (
        <p className="text-center text-[11px] text-stone-500">
          <Link href="/app/market" className={MARKET_CTA_LINK}>
            ← {t("market_tab_quotes")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function MarketHubClient({
  locale,
  initialTickers,
}: {
  locale: Locale;
  initialTickers: MarketTicker[] | null;
}) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <MarketHubInner locale={locale} initialTickers={initialTickers} />
    </Suspense>
  );
}
