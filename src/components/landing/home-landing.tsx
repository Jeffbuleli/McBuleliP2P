import Link from "next/link";
import { unstable_cache } from "next/cache";
import { LandingAvecStaking } from "@/components/landing/v2/landing-avec-staking";
import { LandingFlashRates } from "@/components/landing/v2/landing-flash-rates";
import { LandingHeroV2 } from "@/components/landing/v2/landing-hero-v2";
import { LandingLaunchHero } from "@/components/landing/landing-launch-hero";
import { LandingMarketTable } from "@/components/landing/v2/landing-market-table";
import { LandingNavbarV2 } from "@/components/landing/v2/landing-navbar-v2";
import { LandingServices } from "@/components/landing/v2/landing-services";
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

  const legal = [
    { href: "/about", label: d.landing_footer_about },
    { href: "/whitepaper", label: d.landing_footer_whitepaper },
    { href: "/contact", label: d.landing_footer_contact },
    { href: "/terms", label: d.landing_footer_terms },
    { href: "/privacy", label: d.landing_footer_privacy },
  ];

  return (
    <div className="landing-v2 min-h-dvh bg-[#fafaf9] text-stone-900">
      <LandingNavbarV2 />

      <LandingHeroV2 d={d} />

      <LandingServices />

      {launchCampaignEnabled() ? (
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6">
          <LandingLaunchHero />
        </div>
      ) : null}

      <LandingFlashRates initialTickers={tickers} />

      <LandingMarketTable initialTickers={tickers} />

      <LandingAvecStaking />

      <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs text-stone-500">{d.landing_footer_tagline}</p>
          <nav
            className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600"
            aria-label="Legal"
          >
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="hover:text-[#305F33]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-5 text-center text-[11px] text-stone-400">
            © {new Date().getFullYear()} {d.brand}
          </p>
        </div>
      </footer>
    </div>
  );
}
