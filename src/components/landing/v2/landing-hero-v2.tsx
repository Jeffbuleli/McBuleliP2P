import { LandingHeroCta } from "@/components/landing/v2/landing-hero-cta";
import { LandingHeroPhoneBlock } from "@/components/landing/v2/landing-hero-phone-block";
import { LandingPartnersStrip } from "@/components/landing/v2/landing-partners-strip";
import { HudOrbit } from "@/components/about/about-ui";
import type { Messages } from "@/i18n/messages";

type HeroDict = Pick<
  Messages,
  "landing_v2_hero_title" | "landing_v2_hero_sub" | "landing_v2_partners_label" | "landing_v2_partners_sub"
>;

export function LandingHeroV2({ d }: { d: HeroDict }) {
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
      <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
        <div className="text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/5 px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            PWA · Mobile first
          </p>
          <h1 className="mt-4 text-balance bg-linear-to-br from-white via-cyan-100 to-emerald-400/90 bg-clip-text text-2xl font-black leading-tight text-transparent sm:text-4xl">
            {d.landing_v2_hero_title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-400 sm:text-base">
            {d.landing_v2_hero_sub}
          </p>
          <LandingHeroCta />
        </div>

        <div className="mt-8 hidden shrink-0 lg:block">
          <HudOrbit label="RDC · AFRICA · FINTECH" />
        </div>
      </div>

      <div className="relative mx-auto mt-6 max-w-7xl sm:mt-8 lg:mt-10">
        <LandingHeroPhoneBlock />
      </div>

      <div className="relative mx-auto mt-6 max-w-7xl sm:mt-8">
        <LandingPartnersStrip d={d} />
      </div>
    </section>
  );
}
