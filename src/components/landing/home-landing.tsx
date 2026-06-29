import { unstable_cache } from "next/cache";
import { LandingAvecStaking } from "@/components/landing/v2/landing-avec-staking";
import { LandingFlashRates } from "@/components/landing/v2/landing-flash-rates";
import { LandingHeroV2 } from "@/components/landing/v2/landing-hero-v2";
import { LandingLaunchHero } from "@/components/landing/landing-launch-hero";
import { LandingMarketTable } from "@/components/landing/v2/landing-market-table";
import { LandingNavbarV2 } from "@/components/landing/v2/landing-navbar-v2";
import { LandingFuturisticBg } from "@/components/landing/landing-futuristic-bg";
import { launchCampaignEnabled } from "@/lib/launch-campaign";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";
import { LandingFooterV2 } from "@/components/landing/v2/landing-footer-v2";

const getLandingTickers = unstable_cache(
  () => fetchMarketTickers(),
  ["landing-market-tickers"],
  { revalidate: 30 },
);

export async function HomeLanding() {
  const locale = await getLocale();
  const d = getDictionary(locale);
  const tickers = await getLandingTickers();

  return (
    <div className="landing-futuristic relative min-h-dvh overflow-hidden bg-[#050810] text-stone-100">
      <LandingFuturisticBg />
      <div className="relative z-10">
        <LandingNavbarV2 />

        <LandingHeroV2 d={d} />

        {launchCampaignEnabled() ? (
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
            <LandingLaunchHero />
          </div>
        ) : null}

        <LandingFlashRates initialTickers={tickers} />

        <LandingMarketTable initialTickers={tickers} />

        <LandingAvecStaking />

        <LandingFooterV2 />
      </div>
    </div>
  );
}
