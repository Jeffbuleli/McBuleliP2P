import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Fraunces, DM_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { RdpiDashboardClient } from "@/components/rdpi/rdpi-dashboard-client";
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

export const metadata: Metadata = {
  title: "Dashboard enquête RDPI · Réponses",
  description:
    "Espace partenaire RDPI Think Tank — statistiques et export des réponses à l'enquête fiscalité numérique.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${CANONICAL_PRODUCTION_ORIGIN}/rdpi/dashboard`,
  },
};

export default function RdpiDashboardPage() {
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
          "--fd-border": "rgba(10,10,10,0.12)",
          "--fd-primary": RDPI_BRAND.blue,
          "--fd-text": RDPI_BRAND.ink,
          background:
            "radial-gradient(1000px 420px at 0% 0%, rgba(30,94,255,0.1), transparent 50%), linear-gradient(180deg, #fbfaf7 0%, #f0eee7 100%)",
          color: RDPI_BRAND.ink,
        } as CSSProperties
      }
    >
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 pt-6">
        <Link href="/rdpi" className="flex items-center gap-3">
          <Image
            src={RDPI_BRAND.logoUrl}
            alt={RDPI_BRAND.name}
            width={200}
            height={64}
            className="h-11 w-auto object-contain"
          />
        </Link>
        <Link
          href="/rdpi"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--rdpi-muted)]"
        >
          Questionnaire
        </Link>
      </header>
      <RdpiDashboardClient />
    </div>
  );
}
