"use client";

import Image from "next/image";
import { LandingHeroCta } from "@/components/landing/v2/landing-hero-cta";
import { LandingHeroPhoneBlock } from "@/components/landing/v2/landing-hero-phone-block";
import { useI18n } from "@/components/i18n-provider";
import { LANDING_HERO_PARTNERS } from "@/lib/landing-hero-partners";

export function LandingHeroV2() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden bg-[#fafaf9] px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_0%,rgba(48,95,51,0.10),transparent_55%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="max-w-xl text-left">
          <p className="text-2xl font-extrabold tracking-tight text-[#305F33] sm:text-3xl">
            {t("brand")}
          </p>
          <h1 className="mt-2 text-balance text-2xl font-bold leading-tight text-stone-900 sm:text-3xl">
            {t("landing_v2_hero_title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
            {t("landing_v2_hero_sub")}
          </p>
          <LandingHeroCta />
        </div>

        <div className="mt-8 lg:flex lg:justify-start">
          <LandingHeroPhoneBlock />
        </div>

        <div className="mt-8 border-t border-stone-200/80 pt-5">
          <p className="text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            {t("landing_v2_partners_label")}
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
