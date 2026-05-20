import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { loadP2pHomeActivity } from "@/lib/p2p-activity";
import {
  emptyPortfolioSnapshot,
  formatPortfolioTotalWithStaking,
  getPortfolioSnapshotForUser,
} from "@/lib/portfolio-display";
import { getSessionUserId } from "@/lib/session";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { homeDisplayName, homeGreetingLine } from "@/lib/home-greeting";
import { BalanceCard } from "@/components/mobile/balance-card";
import { AssetStrip } from "@/components/mobile/asset-strip";
import { TradeHubPreview } from "@/components/mobile/trade-hub-preview";
import { MarketPreview } from "@/components/mobile/market-preview";
import { P2PHomeCard } from "@/components/mobile/p2p-home-card";
import { P2PRecentActivity } from "@/components/mobile/p2p-recent-activity";
import { PriceChartLazy } from "@/components/dashboard/price-chart-lazy";
import { getStakingValuationUsd } from "@/lib/staking-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();

  if (!userId) {
    return null;
  }

  const db = getDb();
  const [userRow] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      piUsername: users.piUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const snapshot = await getPortfolioSnapshotForUser(userId, locale);
  const stakeVal = await getStakingValuationUsd(userId);
  const lang = locale === "fr" ? "fr" : "en";

  const p2pHome = await loadP2pHomeActivity({ userId, limit: 3 });
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

  const greeting = homeGreetingLine(
    lang,
    userRow ? homeDisplayName(userRow) : null,
  );

  return (
    <div className="home-theme wallet-theme home-scroll -mx-4 space-y-3 px-4 pb-2">
      <header className="pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--fd-text)]">
          {greeting}
        </h1>
      </header>

      <BalanceCard
        locale={locale}
        totalEquivDisplay={s.totalEquivDisplay}
        usdtDisplay={s.usdtDisplay}
        piDisplay={s.piDisplay}
      />

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

      {p2pHome.items.length > 0 ? (
        <P2PRecentActivity items={p2pHome.items} />
      ) : null}
    </div>
  );
}
