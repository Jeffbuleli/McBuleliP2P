import Image from "next/image";
import { HudFrame } from "@/components/about/about-ui";
import { LANDING_HERO_PARTNERS } from "@/lib/landing-hero-partners";
import type { Messages } from "@/i18n/messages";

type PartnersDict = Pick<Messages, "landing_v2_partners_label" | "landing_v2_partners_sub">;

function partnerLogoClass(id: string) {
  if (id === "okx") {
    return "h-5 w-auto max-w-full object-contain brightness-0 invert opacity-95 sm:h-6";
  }
  return "h-4 w-auto max-w-full object-contain opacity-70 brightness-110 transition group-hover:opacity-100 sm:h-5";
}

export function LandingPartnersStrip({ d }: { d: PartnersDict }) {
  return (
    <HudFrame accent="green" className="relative mx-auto max-w-7xl" label={d.landing_v2_partners_label}>
      <div className="rounded-2xl border border-white/8 bg-[#0a1018]/60 p-3 sm:p-4">
        <p className="mb-3 text-xs text-stone-500 sm:text-sm">{d.landing_v2_partners_sub}</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2.5">
          {LANDING_HERO_PARTNERS.map((p) => (
            <div
              key={p.id}
              className="group flex h-11 items-center justify-center rounded-xl border border-white/8 bg-white/[0.02] px-2 transition hover:border-cyan-400/25 hover:bg-cyan-500/[0.05] sm:h-12"
              title={p.label}
            >
              <Image
                src={p.logo}
                alt={p.label}
                width={100}
                height={32}
                className={partnerLogoClass(p.id)}
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </HudFrame>
  );
}
