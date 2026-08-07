import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Fraunces, DM_Sans } from "next/font/google";
import { RdpiLogoMark } from "@/components/rdpi/rdpi-logo-mark";
import { RdpiPoweredFooter } from "@/components/rdpi/rdpi-powered-footer";
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
      className={`${display.variable} ${sans.variable} relative min-h-screen overflow-x-hidden font-[family-name:var(--font-rdpi-sans)]`}
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
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] overflow-hidden" aria-hidden>
        <svg
          className="absolute -right-20 top-6 h-[380px] w-[380px] opacity-[0.08]"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="88" fill="none" stroke={RDPI_BRAND.blue} strokeWidth="2" />
          <circle cx="100" cy="100" r="58" fill="none" stroke={RDPI_BRAND.gold} strokeWidth="1.5" />
          <path
            d="M100 22 L107 76 L162 76 L117 108 L134 162 L100 132 L66 162 L83 108 L38 76 L93 76 Z"
            fill={RDPI_BRAND.gold}
            opacity="0.45"
          />
        </svg>
        <svg
          className="absolute -left-16 top-24 h-[280px] w-[280px] opacity-[0.06]"
          viewBox="0 0 200 200"
        >
          <rect x="24" y="24" width="152" height="152" rx="36" fill="none" stroke={RDPI_BRAND.ink} strokeWidth="2" />
          <rect x="48" y="48" width="104" height="104" rx="24" fill={RDPI_BRAND.blue} opacity="0.35" />
        </svg>
      </div>

      <header
        className={`relative z-10 mx-auto flex items-center px-4 pt-6 sm:pt-8 ${
          wide ? "max-w-5xl" : "max-w-[440px]"
        }`}
      >
        <Link href="/rdpi" className="inline-flex" aria-label={RDPI_BRAND.name}>
          <RdpiLogoMark size={wide ? "md" : "lg"} />
        </Link>
      </header>

      <main className="relative z-10">{children}</main>

      {showFooter ? (
        <div className={`relative z-10 mx-auto px-4 pb-10 ${wide ? "max-w-5xl" : "max-w-[440px]"}`}>
          <RdpiPoweredFooter />
        </div>
      ) : null}
    </div>
  );
}
