import { unstable_cache } from "next/cache";
import { LandingAvecStaking } from "@/components/landing/v2/landing-avec-staking";
import { LandingFlashRates } from "@/components/landing/v2/landing-flash-rates";
import { LandingHeroV2 } from "@/components/landing/v2/landing-hero-v2";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHackathonHero } from "@/components/landing/landing-hackathon-hero";
import { LandingMarketTable } from "@/components/landing/v2/landing-market-table";
import { LandingNavbarV2 } from "@/components/landing/v2/landing-navbar-v2";
import { LandingServices } from "@/components/landing/v2/landing-services";
import { fetchMarketTickers } from "@/lib/market-tickers";

const getLandingTickers = unstable_cache(
  () => fetchMarketTickers(),
  ["landing-market-tickers"],
  { revalidate: 30 },
);

export async function HomeLanding() {
  const tickers = await getLandingTickers();

  return (
    <div className="landing-v2 min-h-dvh bg-[#fafaf9] text-stone-900">
      <LandingNavbarV2 />

      <LandingHeroV2 />

      <LandingServices />

      <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6">
        <LandingHackathonHero />
      </div>

      <LandingFlashRates initialTickers={tickers} />

      <LandingMarketTable initialTickers={tickers} />

      <LandingAvecStaking />

      <LandingFooter />
    </div>
  );
}
