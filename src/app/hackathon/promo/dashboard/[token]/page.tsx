import type { Metadata } from "next";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { PartnerPromoDashboardClient } from "@/components/hackathon/partner-promo-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard partenaire - McBuleli Hackathon",
  robots: { index: false, follow: false },
};

export default async function PartnerPromoDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="home-theme fd-public-light min-h-dvh bg-[color:var(--fd-bg)]">
      <LandingTopBar authReturnPath="/hackathon" />
      <PartnerPromoDashboardClient token={token} />
    </div>
  );
}
