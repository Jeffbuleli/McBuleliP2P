import Link from "next/link";
import { loadP2pHomeActivity } from "@/lib/p2p-activity";
import { getPortfolioSnapshotForUser } from "@/lib/portfolio-display";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { BalanceCard } from "@/components/mobile/balance-card";
import { AssetStrip } from "@/components/mobile/asset-strip";
import { TradeHubPreview } from "@/components/mobile/trade-hub-preview";
import { MarketPreview } from "@/components/mobile/market-preview";
import { P2PHomeCard } from "@/components/mobile/p2p-home-card";
import { P2PRecentActivity } from "@/components/mobile/p2p-recent-activity";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { getDictionary } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();

  if (!userId) {
    return null;
  }

  const snapshot = await getPortfolioSnapshotForUser(userId, locale);
  const d = getDictionary(locale);

  const p2pHome = await loadP2pHomeActivity({ userId, limit: 8 });
  const tickers = await fetchMarketTickers();

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
      <P2PHomeCard
        inProgressCount={p2pHome.inProgressCount}
        disputedCount={p2pHome.disputedCount}
        previewOrders={p2pHome.items}
      />

      <BalanceCard
        locale={locale}
        totalEquivDisplay={s.totalEquivDisplay}
        usdtDisplay={s.usdtDisplay}
        piDisplay={s.piDisplay}
        fiatUsdDisplay={s.fiatUsdDisplay}
        fiatCdfDisplay={s.fiatCdfDisplay}
      />

      <Link
        href="/app/wallet"
        prefetch
        className="-mt-1 block min-h-[44px] rounded-xl border border-stone-700/50 bg-stone-950/50 py-3 text-center text-sm font-semibold text-emerald-200 transition hover:bg-stone-900/60 active:scale-[0.99]"
      >
        {d.wallet_see_all}
      </Link>

      <AssetStrip
        locale={locale}
        usdtBalance={s.usdtDisplay}
        piBalance={s.piDisplay}
        fiatUsdApprox={s.fiatUsdDisplay}
        fiatCdfApprox={s.fiatCdfDisplay}
      />

      <PriceChartLazy />

      <MarketPreview locale={locale} initialTickers={tickers} />

      <TradeHubPreview locale={locale} />

      <P2PRecentActivity items={p2pHome.items} />
    </div>
  );
}
