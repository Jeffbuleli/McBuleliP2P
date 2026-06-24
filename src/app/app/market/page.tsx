import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { MarketPreview } from "@/components/mobile/market-preview";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { getDictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

/** Live quotes + interactive chart (Binance majors, Pi via OKX). */
export default async function MarketPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  return (
    <div className="flex flex-col gap-3 pb-2">
      <div className="flex items-center gap-2 px-0.5">
        <Link
          href="/app"
          className="text-sm font-semibold text-[color:var(--fd-primary)]"
        >
          ← {d.nav_home}
        </Link>
      </div>

      <header className="px-0.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--fd-primary)]">
          McBuleli
        </p>
        <h1 className="text-2xl font-black tracking-tight text-[color:var(--fd-text)]">
          {d.view_market}
        </h1>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{d.market_live_hint}</p>
      </header>

      <PriceChartLazy appearance="light" deferUntilVisible />

      <MarketPreview
        locale={locale}
        initialTickers={tickers}
        showViewLink={false}
        appearance="light"
        layout="cards"
      />

      <McBuleliPoweredFooter />
    </div>
  );
}
