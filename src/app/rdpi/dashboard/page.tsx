import type { Metadata } from "next";
import { RdpiShell } from "@/components/rdpi/rdpi-shell";
import { RdpiDashboardClient } from "@/components/rdpi/rdpi-dashboard-client";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard enquête RDPI - Réponses",
  description:
    "Espace RDPI Think Tank - statistiques et export des réponses à l'enquête fiscalité numérique.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${CANONICAL_PRODUCTION_ORIGIN}/rdpi/dashboard`,
  },
};

export default function RdpiDashboardPage() {
  return (
    <RdpiShell wide showFooter={false}>
      <RdpiDashboardClient />
    </RdpiShell>
  );
}
