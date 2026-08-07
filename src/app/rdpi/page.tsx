import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Fraunces, DM_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { RdpiSurveyForm } from "@/components/rdpi/rdpi-survey-form";
import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const dynamic = "force-dynamic";

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

const TITLE =
  "Enquête RDPI · Fiscalité & secteur numérique en RDC";
const DESCRIPTION =
  "Questionnaire RDPI Think Tank sur l'impact de la fiscalité sur l'entrepreneuriat, l'innovation et le développement du secteur numérique en République démocratique du Congo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${CANONICAL_PRODUCTION_ORIGIN}/rdpi` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${CANONICAL_PRODUCTION_ORIGIN}/rdpi`,
    siteName: "RDPI Think Tank × McBuleli",
    images: [
      {
        url: `${CANONICAL_PRODUCTION_ORIGIN}${RDPI_BRAND.logoUrl.split("?")[0]}`,
        alt: "RDPI Think Tank",
      },
    ],
  },
  robots: { index: true, follow: true },
};

export default function RdpiSurveyPage() {
  return (
    <div
      className={`${display.variable} ${sans.variable} min-h-screen font-[family-name:var(--font-rdpi-sans)]`}
      style={
        {
          "--rdpi-blue": RDPI_BRAND.blue,
          "--rdpi-gold": RDPI_BRAND.gold,
          "--rdpi-ink": RDPI_BRAND.ink,
          "--rdpi-muted": RDPI_BRAND.muted,
          "--rdpi-paper": RDPI_BRAND.paper,
          background:
            "radial-gradient(1200px 500px at 10% -10%, rgba(30,94,255,0.12), transparent 55%), radial-gradient(900px 420px at 100% 0%, rgba(232,185,35,0.14), transparent 50%), linear-gradient(180deg, #fbfaf7 0%, #f3f1ea 100%)",
          color: RDPI_BRAND.ink,
        } as CSSProperties
      }
    >
      {/* Decorative SVG atmosphere */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden>
        <svg
          className="absolute -right-16 top-8 h-[360px] w-[360px] opacity-[0.07]"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="88" fill="none" stroke={RDPI_BRAND.blue} strokeWidth="2" />
          <circle cx="100" cy="100" r="60" fill="none" stroke={RDPI_BRAND.gold} strokeWidth="1.5" />
          <path
            d="M100 20 L108 78 L168 78 L118 112 L136 170 L100 136 L64 170 L82 112 L32 78 L92 78 Z"
            fill={RDPI_BRAND.gold}
            opacity="0.35"
          />
        </svg>
      </div>

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 pt-6 sm:pt-8">
        <Link href="/rdpi" className="flex items-center gap-3">
          <Image
            src={RDPI_BRAND.logoUrl}
            alt={RDPI_BRAND.name}
            width={220}
            height={72}
            priority
            className="h-12 w-auto object-contain sm:h-14"
          />
        </Link>
        <Link
          href="/rdpi/dashboard"
          className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--rdpi-muted)] backdrop-blur transition hover:border-black/20 hover:text-[color:var(--rdpi-ink)]"
        >
          Espace partenaire
        </Link>
      </header>

      <main className="relative z-10">
        <RdpiSurveyForm />
      </main>
    </div>
  );
}
