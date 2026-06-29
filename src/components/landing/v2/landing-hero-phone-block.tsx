"use client";

import { LandingHeroPhone } from "@/components/landing/v2/landing-hero-phone";
import { SessionAppLink } from "@/components/landing/session-app-link";
import { useI18n } from "@/components/i18n-provider";

const FLOAT_PILL =
  "rounded-full border font-mono text-[9px] font-bold uppercase tracking-[0.12em] backdrop-blur-md transition active:scale-95 sm:text-[10px]";

/** Phone mockup with session-aware BUY · SELL · P2P hit zones. */
export function LandingHeroPhoneBlock() {
  const { t } = useI18n();

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a1018]/90 p-3 shadow-[0_0_48px_-16px_rgba(34,211,238,0.3)] sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-size-[24px_24px] opacity-50"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[380px]">
          <div className="relative rounded-[1.75rem] border border-cyan-500/15 bg-[#050810]/80 p-1.5 ring-1 ring-white/5 sm:p-2">
            <LandingHeroPhone className="mx-auto h-auto w-full" />

            <SessionAppLink
              href="/app/wallet/deposit"
              className={`absolute left-[6%] top-[38%] flex h-9 min-w-[3.25rem] items-center justify-center ${FLOAT_PILL} border-emerald-400/35 bg-emerald-500/15 text-emerald-300 sm:h-10`}
              aria-label={t("landing_hero_buy")}
            >
              {t("landing_hero_buy")}
            </SessionAppLink>

            <SessionAppLink
              href="/app/p2p"
              className={`absolute left-[6%] top-[48%] flex h-9 min-w-[3.25rem] items-center justify-center ${FLOAT_PILL} border-amber-500/30 bg-amber-500/15 text-amber-200 sm:h-10`}
              aria-label={t("landing_hero_sell")}
            >
              {t("landing_hero_sell")}
            </SessionAppLink>

            <SessionAppLink
              href="/app/p2p"
              className={`absolute right-[4%] top-[40%] flex flex-col items-center justify-center rounded-2xl ${FLOAT_PILL} border-cyan-400/30 bg-[#050810]/90 px-3 py-2 text-cyan-300`}
              aria-label={t("landing_hero_p2p")}
            >
              <svg className="h-5 w-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <path d="M7 10h10M7 14h6" strokeLinecap="round" />
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M8 19v2M16 19v2" strokeLinecap="round" />
              </svg>
              <span className="mt-0.5">{t("landing_hero_p2p")}</span>
            </SessionAppLink>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5 font-mono text-[7px] font-bold uppercase tracking-[0.1em] sm:gap-2 sm:text-[8px]">
            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-1.5 py-1.5 text-center text-emerald-400/80 sm:px-2">
              USDT · escrow
            </span>
            <span className="rounded-full border border-cyan-500/15 bg-cyan-500/5 px-1.5 py-1.5 text-center text-cyan-400/80 sm:px-2">
              Pi · P2P
            </span>
            <span className="rounded-full border border-fuchsia-500/15 bg-fuchsia-500/5 px-1.5 py-1.5 text-center text-fuchsia-400/70 sm:px-2">
              Mobile money
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
