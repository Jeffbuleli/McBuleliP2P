import { fetchMarketTickers } from "@/lib/market-tickers";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { MarketPreview } from "@/components/mobile/market-preview";

export default async function MarketPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  return (
    <div className="flex flex-col gap-4 pb-2">
      <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">
        {d.market_title}
      </h1>
      <MarketPreview
        locale={locale}
        initialTickers={tickers}
        showViewLink={false}
      />
      <p className="text-center text-xs text-stone-500 dark:text-stone-400">
        {d.market_disclaimer}
      </p>
    </div>
  );
}
