"use client";

import { LandingHeroPhone } from "@/components/landing/v2/landing-hero-phone";
import { SessionAppLink } from "@/components/landing/session-app-link";
import { useI18n } from "@/components/i18n-provider";

/** Phone mockup with session-aware BUY · SELL · P2P hit zones (replaces separate action grid). */
export function LandingHeroPhoneBlock() {
  const { t } = useI18n();

  return (
    <div className="relative w-full max-w-[360px] lg:mx-0 lg:max-w-[380px]">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-stone-50 via-white to-[#305F33]/5 p-2 ring-1 ring-stone-200/80 sm:rounded-[2rem] sm:p-4">
        <LandingHeroPhone className="mx-auto h-auto w-full" />

        {/* Floating BUY — left */}
        <SessionAppLink
          href="/app/wallet/deposit"
          className="absolute left-[6%] top-[38%] flex h-9 min-w-[3.25rem] items-center justify-center rounded-full bg-[#305F33] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-emerald-900/20 transition active:scale-95 sm:h-10 sm:text-[11px]"
          aria-label={t("landing_hero_buy")}
        >
          {t("landing_hero_buy")}
        </SessionAppLink>

        {/* Floating SELL */}
        <SessionAppLink
          href="/app/p2p"
          className="absolute left-[6%] top-[48%] flex h-9 min-w-[3.25rem] items-center justify-center rounded-full bg-[#78350f] px-3 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg shadow-stone-900/15 transition active:scale-95 sm:h-10 sm:text-[11px]"
          aria-label={t("landing_hero_sell")}
        >
          {t("landing_hero_sell")}
        </SessionAppLink>

        {/* P2P escrow badge — right */}
        <SessionAppLink
          href="/app/p2p"
          className="absolute right-[4%] top-[40%] flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm transition active:scale-95"
          aria-label={t("landing_hero_p2p")}
        >
          <svg className="h-5 w-5 text-[#305F33]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M7 10h10M7 14h6" strokeLinecap="round" />
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M8 19v2M16 19v2" strokeLinecap="round" />
          </svg>
          <span className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[#305F33] sm:text-[10px]">
            {t("landing_hero_p2p")}
          </span>
        </SessionAppLink>
      </div>
    </div>
  );
}
