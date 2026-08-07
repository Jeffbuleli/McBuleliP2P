import type { Metadata } from "next";
import { RdpiShell } from "@/components/rdpi/rdpi-shell";
import { RdpiSurveyForm } from "@/components/rdpi/rdpi-survey-form";
import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const dynamic = "force-dynamic";

const TITLE = "Enquête RDPI - Fiscalité & secteur numérique en RDC";
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
    siteName: "RDPI Think Tank x McBuleli",
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
    <RdpiShell>
      <RdpiSurveyForm />
    </RdpiShell>
  );
}
