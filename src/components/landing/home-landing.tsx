import { unstable_cache } from "next/cache";
import { LandingAvecStaking } from "@/components/landing/v2/landing-avec-staking";
import { LandingFlashRates } from "@/components/landing/v2/landing-flash-rates";
import { LandingHeroV2 } from "@/components/landing/v2/landing-hero-v2";
import { LandingLaunchHero } from "@/components/landing/landing-launch-hero";
import { LandingMarketTable } from "@/components/landing/v2/landing-market-table";
import { LandingNavbarV2 } from "@/components/landing/v2/landing-navbar-v2";
import { launchCampaignEnabled } from "@/lib/launch-campaign";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { fetchMarketTickers } from "@/lib/market-tickers";

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
    <div className="landing-v2 min-h-dvh bg-[#fafaf9] text-stone-900">
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

      <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs text-stone-500">{d.landing_footer_tagline}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">
            <span className="rounded-full bg-stone-50 px-2.5 py-1 ring-1 ring-stone-200">P2P escrow</span>
            <span className="rounded-full bg-stone-50 px-2.5 py-1 ring-1 ring-stone-200">Mobile money</span>
            <span className="rounded-full bg-stone-50 px-2.5 py-1 ring-1 ring-stone-200">BSC</span>
          </div>
          <p className="mt-4 text-[11px] text-stone-400">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
