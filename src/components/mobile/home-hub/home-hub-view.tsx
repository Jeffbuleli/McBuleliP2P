import Link from "next/link";
import type { Locale } from "@/i18n/locale";
import { CommunityLiveBanner } from "@/components/community/community-live-banner";
import { P2PHomeCard } from "@/components/mobile/p2p-home-card";
import { P2PRecentActivity } from "@/components/mobile/p2p-recent-activity";
import { HomeCommunityPreview } from "@/components/mobile/home-hub/home-community-preview";
import { HomeMarketStrip } from "@/components/mobile/home-hub/home-market-strip";
import { HomeOnboardingBanner } from "@/components/mobile/home-hub/home-onboarding-banner";
import { HomeP2pPromo } from "@/components/mobile/home-hub/home-p2p-promo";
import { HomePortfolioSnapshot } from "@/components/mobile/home-hub/home-portfolio-snapshot";
import { HomeQuickActions } from "@/components/mobile/home-hub/home-quick-actions";
import type { HomeHubData } from "@/lib/home-hub-data";

export function HomeHubView({
  data,
  locale,
}: {
  data: HomeHubData;
  locale: Locale;
}) {
  const fr = locale === "fr";

  return (
    <div className="home-theme wallet-theme home-scroll -mx-4 space-y-3 px-4 pb-2">
      <header className="flex items-start justify-between gap-3 pt-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[color:var(--fd-text)]">
          {data.greeting}
        </h1>
        {data.showKycCta ? (
          <Link
            href="/app/profile/kyc"
            className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800"
          >
            {fr ? "KYC →" : "KYC →"}
          </Link>
        ) : null}
      </header>

      {data.showOnboarding ? <HomeOnboardingBanner fr={fr} /> : null}

      <CommunityLiveBanner fr={fr} />

      <HomePortfolioSnapshot
        locale={locale}
        totalDisplay={data.totalDisplay}
        assetChips={data.assetChips}
      />

      <HomeQuickActions fr={fr} liveActive={data.liveBadge.live} />

      <HomeMarketStrip locale={locale} initialTickers={data.tickers} />

      <HomeCommunityPreview
        fr={fr}
        posts={data.trendingPosts}
        traders={data.topTraders}
      />

      {data.p2p.showFullCard ? (
        <>
          <P2PHomeCard
            inProgressCount={data.p2p.inProgressCount}
            disputedCount={data.p2p.disputedCount}
            previewOrders={data.p2p.items}
          />
          {data.p2p.items.length > 0 ? (
            <P2PRecentActivity items={data.p2p.items} />
          ) : null}
        </>
      ) : (
        <HomeP2pPromo fr={fr} />
      )}
    </div>
  );
}
