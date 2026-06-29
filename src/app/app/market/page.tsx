import { MarketHubClient } from "@/components/market/market-hub-client";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";

export const dynamic = "force-dynamic";

/** Unified market hub: quotes, futures manual, bots - one chart, one entry point. */
export default async function MarketPage() {
  const locale = await getLocale();
  const tickers = await fetchMarketTickers();

  return (
    <div className="market-theme flex flex-col gap-3 pb-2">
      <MarketHubClient locale={locale} initialTickers={tickers} />
      <McBuleliPoweredFooter />
    </div>
  );
}
