import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Fraunces, DM_Sans } from "next/font/google";
import { RdpiLogoMark } from "@/components/rdpi/rdpi-logo-mark";
import { RdpiPoweredFooter } from "@/components/rdpi/rdpi-powered-footer";
import { RdpiIlluSunburst } from "@/components/rdpi/rdpi-illustrations";
import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-rdpi-display",
  weight: ["500", "600", "700"],
});

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-rdpi-sans",
  weight: ["400", "500", "600", "700"],
});

export function RdpiShell({
  children,
  wide = false,
  showFooter = true,
}: {
  children: ReactNode;
  wide?: boolean;
  showFooter?: boolean;
}) {
  return (
    <div
      className={`${display.variable} ${sans.variable} rdpi-theme relative min-h-screen overflow-x-hidden font-[family-name:var(--font-rdpi-sans)]`}
      style={
        {
          "--rdpi-blue": RDPI_BRAND.blue,
          "--rdpi-gold": RDPI_BRAND.gold,
          "--rdpi-ink": RDPI_BRAND.ink,
          "--rdpi-muted": RDPI_BRAND.muted,
          "--rdpi-paper": "#FAFAF8",
          "--fd-border": "rgba(10,10,10,0.1)",
          "--fd-primary": RDPI_BRAND.blue,
          "--fd-text": RDPI_BRAND.ink,
          background:
            "radial-gradient(900px 420px at 8% -8%, rgba(30,94,255,0.16), transparent 55%), radial-gradient(700px 380px at 100% 0%, rgba(232,185,35,0.14), transparent 48%), linear-gradient(180deg, #F4F3EE 0%, #EBE9E2 100%)",
          color: RDPI_BRAND.ink,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] overflow-hidden" aria-hidden>
        <RdpiIlluSunburst className="absolute -right-10 top-4 h-[300px] w-[300px] opacity-[0.12] sm:h-[360px] sm:w-[360px]" />
        <svg
          className="absolute -left-16 top-28 h-[260px] w-[260px] opacity-[0.07]"
          viewBox="0 0 200 200"
        >
          <rect x="24" y="24" width="152" height="152" rx="36" fill="none" stroke={RDPI_BRAND.ink} strokeWidth="2" />
          <rect x="48" y="48" width="104" height="104" rx="24" fill={RDPI_BRAND.blue} opacity="0.35" />
        </svg>
      </div>

      <header
        className={`relative z-10 mx-auto flex w-full flex-col items-center px-4 pt-7 text-center sm:px-6 sm:pt-10 md:px-8 ${
          wide ? "max-w-6xl" : "max-w-lg sm:max-w-xl md:max-w-2xl"
        }`}
      >
        <Link href="/rdpi" className="inline-flex justify-center" aria-label={RDPI_BRAND.name}>
          <RdpiLogoMark size="hero" />
        </Link>
      </header>

      <main className="relative z-10 w-full">{children}</main>

      {showFooter ? (
        <div
          className={`relative z-10 mx-auto w-full px-4 pb-10 sm:px-6 md:px-8 ${
            wide ? "max-w-6xl" : "max-w-lg sm:max-w-xl md:max-w-2xl"
          }`}
        >
          <RdpiPoweredFooter />
        </div>
      ) : null}
    </div>
  );
}
