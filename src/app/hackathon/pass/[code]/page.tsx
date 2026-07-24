import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonPassView } from "@/components/hackathon/hackathon-pass-view";
import type { HackathonBadgeKind } from "@/components/hackathon/hackathon-pass-badge";
import { HACKATHON_VENUE_SILIKIN } from "@/lib/hackathon/constants";
import { getPassByCode, passPublicUrl } from "@/lib/hackathon/access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Badge Hackathon - McBuleli",
  robots: { index: false, follow: false },
};

export default async function HackathonPassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const data = await getPassByCode(code).catch(() => null);
  if (!data?.pass?.valid || !data.pass.ticketCode) {
    notFound();
  }

  const { pass, edition } = data;
  const passUrl = passPublicUrl(pass.ticketCode);
  const venue =
    edition?.venue && !/confirmer|tbd|tba/i.test(edition.venue)
      ? edition.venue
      : HACKATHON_VENUE_SILIKIN;

  const kind: HackathonBadgeKind =
    pass.subjectType === "partner" ? "partner" : "ticket";

  return (
    <div className="min-h-dvh bg-[#F3F4F1]">
      <LandingTopBar authReturnPath="/hackathon" />
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
        <HackathonPassView
          kind={kind}
          passUrl={passUrl}
          ticketCode={pass.ticketCode}
          displayName={pass.displayName}
          orgOrEmail={pass.orgOrEmail}
          venue={venue}
          editionNameFr={edition?.nameFr ?? "McBuleli Hackathon"}
          editionNameEn={edition?.nameEn ?? "McBuleli Hackathon"}
        />
      </div>
    </div>
  );
}
