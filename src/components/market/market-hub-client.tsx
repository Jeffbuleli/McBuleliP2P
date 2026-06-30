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
      <div className="h-10 rounded-xl bg-[color:var(--fd-mint)]/50" />
      <div className="h-32 rounded-2xl bg-[color:var(--fd-mint)]/35" />
      <div className="h-48 rounded-2xl bg-[color:var(--fd-mint)]/35" />
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

  const themeClass =
    panel === "bots"
      ? "trade-bots-theme -mx-4 rounded-t-3xl px-4 pb-4 pt-3"
      : panel === "futures"
        ? "trade-futures-theme -mx-4 rounded-t-3xl px-4 pb-4 pt-3"
        : "";

  return (
    <div className="flex flex-col gap-3 pb-2">
      <header className="px-0.5">
        <h1 className="text-2xl font-black tracking-tight text-[color:var(--fd-text)]">
          {t("market_hub_title")}
        </h1>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
          {panel === "quotes"
            ? d.market_live_hint
            : panel === "futures"
              ? t("market_hub_futures_hint")
              : t("market_hub_bots_hint")}
        </p>
      </header>

      <div className="rounded-2xl border border-[color:var(--fd-border)] bg-white shadow-sm">
        <PriceChartLazy
          appearance="light"
          deferUntilVisible={panel === "quotes"}
          density={panel === "quotes" ? "default" : "compact"}
        />
      </div>

      <nav
        className="sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-30 -mx-1 rounded-2xl border border-[color:var(--fd-border)] bg-white/95 p-1 shadow-sm backdrop-blur-sm"
        aria-label={t("market_hub_title")}
      >
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const on = panel === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPanel(tab.id)}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold transition ${
                  on
                    ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] shadow-sm"
                    : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]/30"
                }`}
              >
                <span className={on ? "text-[color:var(--fd-primary)]" : ""}>
                  {tab.icon}
                </span>
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
            appearance="light"
            layout="cards"
          />
          <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
            {t("market_hub_trade_cta")}{" "}
            <button
              type="button"
              className="font-bold text-[color:var(--fd-primary)]"
              onClick={() => setPanel("futures")}
            >
              {t("trade_ui_tab_futures")}
            </button>
            {" · "}
            <button
              type="button"
              className="font-bold text-[color:var(--fd-primary)]"
              onClick={() => setPanel("bots")}
            >
              {t("trade_ui_tab_bots")}
            </button>
          </p>
        </>
      ) : (
        <div className={themeClass}>
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
        <p className="text-center text-[11px] text-[color:var(--fd-muted)]">
          <Link href="/app/market" className="font-bold text-[color:var(--fd-primary)]">
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
