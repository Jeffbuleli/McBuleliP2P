import Image from "next/image";
import { LandingHeroCta } from "@/components/landing/v2/landing-hero-cta";
import { LandingHeroPhoneBlock } from "@/components/landing/v2/landing-hero-phone-block";
import { LANDING_HERO_PARTNERS } from "@/lib/landing-hero-partners";
import type { Messages } from "@/i18n/messages";

type HeroDict = Pick<
  Messages,
  "landing_v2_hero_title" | "landing_v2_hero_sub" | "landing_v2_partners_label"
>;

export function LandingHeroV2({ d }: { d: HeroDict }) {
  return (
    <section className="relative overflow-hidden bg-[#fafaf9] px-4 pb-8 pt-3 sm:px-6 sm:pb-10">
      <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-[#305F33]/8 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl">
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#305F33]">PWA · Mobile first</p>
          <h1 className="mt-2 text-balance text-2xl font-black leading-tight text-stone-900 sm:text-3xl">
            {d.landing_v2_hero_title}
          </h1>
          <p className="mt-1.5 text-sm text-stone-600">{d.landing_v2_hero_sub}</p>
          <LandingHeroCta />
        </div>

        <div className="mt-8 lg:flex lg:justify-start">
          <LandingHeroPhoneBlock />
        </div>

        <div className="mt-8 border-t border-stone-200/80 pt-5">
          <p className="text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-stone-400">
            {d.landing_v2_partners_label}
          </p>
          <div className="-mx-1 mt-3 flex justify-start gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LANDING_HERO_PARTNERS.map((p) => (
              <Image
                key={p.id}
                src={p.logo}
                alt={p.label}
                width={100}
                height={32}
                className="h-7 w-auto max-w-[4.5rem] shrink-0 object-contain opacity-40 grayscale sm:h-8"
                unoptimized
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
