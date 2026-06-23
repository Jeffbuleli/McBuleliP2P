import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { MarketPreview } from "@/components/mobile/market-preview";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { getDictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

/** Live quotes + interactive chart (Binance majors, Pi via OKX). */
export default async function MarketPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center gap-2 px-0.5">
        <Link
          href="/app"
          className="text-sm font-semibold text-[color:var(--fd-primary)]"
        >
          ← {d.nav_home}
        </Link>
      </div>

      <header className="px-0.5">
        <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">{d.market_preview}</h1>
        <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">{d.market_live_hint}</p>
      </header>

      <PriceChartLazy appearance="light" deferUntilVisible />

      <MarketPreview locale={locale} initialTickers={tickers} showViewLink={false} appearance="light" />
    </div>
  );
}
