import Link from "next/link";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { MarketPreview } from "@/components/mobile/market-preview";
import { getDictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

/** Full live quotes list (same data as dashboard preview). */
export default async function MarketPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await fetchMarketTickers();

  return (
    <div className="flex flex-col gap-3 pb-4">
      <div className="flex items-center gap-2 px-0.5">
        <Link
          href="/app"
          className="text-sm font-semibold text-emerald-700 dark:text-emerald-400"
        >
          ← {d.nav_home}
        </Link>
      </div>
      <MarketPreview locale={locale} initialTickers={tickers} showViewLink={false} />
    </div>
  );
}
