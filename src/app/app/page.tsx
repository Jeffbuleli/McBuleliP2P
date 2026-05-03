import { loadRecentActivity } from "@/lib/dashboard-activity";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { getPortfolioSnapshotForUser } from "@/lib/portfolio-display";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { BalanceCard } from "@/components/mobile/balance-card";
import { QuickActions } from "@/components/mobile/quick-actions";
import { AssetStrip } from "@/components/mobile/asset-strip";
import { MarketPreview } from "@/components/mobile/market-preview";
import { RecentActivity } from "@/components/mobile/recent-activity";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();

  if (!userId) {
    return null;
  }

  const snapshot = await getPortfolioSnapshotForUser(userId, locale);

  const tickers = await fetchMarketTickers();
  const activity = await loadRecentActivity(userId, locale, 8);

  const empty = {
    totalEquivDisplay: "≈ 0 USDT",
    usdtDisplay: "0 USDT",
    piDisplay: "0 Pi",
    fiatUsdDisplay: "≈ 0 USD",
    fiatCdfDisplay: "≈ 0 CDF",
  };

  const s = snapshot ?? empty;

  return (
    <div className="flex flex-col gap-4 pb-2">
      <BalanceCard
        totalEquivDisplay={s.totalEquivDisplay}
        usdtDisplay={s.usdtDisplay}
        piDisplay={s.piDisplay}
        fiatUsdDisplay={s.fiatUsdDisplay}
        fiatCdfDisplay={s.fiatCdfDisplay}
      />

      <PriceChartLazy />

      <QuickActions locale={locale} />

      <AssetStrip
        locale={locale}
        usdtBalance={s.usdtDisplay}
        piBalance={s.piDisplay}
        fiatUsdApprox={s.fiatUsdDisplay}
        fiatCdfApprox={s.fiatCdfDisplay}
      />

      <MarketPreview locale={locale} initialTickers={tickers} />

      <RecentActivity locale={locale} items={activity} />
    </div>
  );
}
