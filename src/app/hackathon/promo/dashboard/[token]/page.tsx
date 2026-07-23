import type { Metadata } from "next";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { PartnerPromoDashboardClient } from "@/components/hackathon/partner-promo-dashboard-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard promo - McBuleli Hackathon",
  robots: { index: false, follow: false },
};

export default async function PartnerPromoDashboardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-dvh bg-[#F7F8F5]">
      <LandingTopBar authReturnPath="/hackathon" />
      <PartnerPromoDashboardClient token={token} />
    </div>
  );
}
