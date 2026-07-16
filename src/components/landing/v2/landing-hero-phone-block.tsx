"use client";

import { LandingHeroPhone } from "@/components/landing/v2/landing-hero-phone";

/** Phone mockup only - no floating overlays. */
export function LandingHeroPhoneBlock() {
  return (
    <div className="relative w-full max-w-[360px] lg:mx-0 lg:max-w-[380px]">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-stone-50 via-white to-[#305F33]/5 p-2 ring-1 ring-stone-200/80 sm:rounded-[2rem] sm:p-4">
        <LandingHeroPhone className="mx-auto h-auto w-full" />
      </div>
    </div>
  );
}
