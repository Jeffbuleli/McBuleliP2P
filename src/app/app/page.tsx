import Link from "next/link";
import { loadP2pHomeActivity } from "@/lib/p2p-activity";
import {
  emptyPortfolioSnapshot,
  formatPortfolioTotalWithStaking,
  getPortfolioSnapshotForUser,
} from "@/lib/portfolio-display";
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
import { getStakingValuationUsd } from "@/lib/staking-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();

  if (!userId) {
    return null;
  }

  const snapshot = await getPortfolioSnapshotForUser(userId, locale);
  const stakeVal = await getStakingValuationUsd(userId);
  const d = getDictionary(locale);

  const p2pHome = await loadP2pHomeActivity({ userId, limit: 8 });
  const tickers = await fetchMarketTickers();

  let s = snapshot ?? emptyPortfolioSnapshot(locale);
  if (snapshot) {
    s = {
      ...snapshot,
      totalEquivDisplay: formatPortfolioTotalWithStaking(
        snapshot,
        stakeVal,
        locale,
      ),
    };
  }

  return (
    <div className="home-theme wallet-theme home-scroll -mx-4 space-y-3 px-4 pb-2">
      <header className="pt-0.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--fd-primary)]">
          McBuleli
        </p>
        <h1 className="text-xl font-bold tracking-tight text-[color:var(--fd-text)]">
          {d.nav_home}
        </h1>
        <p className="mt-0.5 text-xs text-[color:var(--fd-muted)]">
          {d.wallet_crypto_only_hint}
        </p>
      </header>

      <BalanceCard
        locale={locale}
        totalEquivDisplay={s.totalEquivDisplay}
        usdtDisplay={s.usdtDisplay}
        piDisplay={s.piDisplay}
      />

      <Link
        href="/app/wallet"
        prefetch
        className="fd-card flex min-h-[48px] items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-[color:var(--fd-primary)] transition active:scale-[0.99]"
      >
        <span>{d.wallet_see_all}</span>
        <span aria-hidden className="text-[color:var(--fd-muted)]">
          →
        </span>
      </Link>

      <AssetStrip
        locale={locale}
        usdtBalance={s.usdtDisplay}
        piBalance={s.piDisplay}
      />

      <PriceChartLazy appearance="light" />

      <MarketPreview
        locale={locale}
        initialTickers={tickers}
        appearance="light"
      />

      <TradeHubPreview locale={locale} />

      <P2PHomeCard
        inProgressCount={p2pHome.inProgressCount}
        disputedCount={p2pHome.disputedCount}
        previewOrders={p2pHome.items}
      />

      <P2PRecentActivity items={p2pHome.items} />
    </div>
  );
}
