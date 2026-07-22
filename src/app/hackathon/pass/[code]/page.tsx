import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import {
  HackathonPassBadge,
  type HackathonBadgeKind,
} from "@/components/hackathon/hackathon-pass-badge";
import { getLocale } from "@/lib/get-locale";
import {
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_DATES_LABEL_FR,
} from "@/lib/hackathon/event-content";
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
  const locale = await getLocale();
  const isFr = locale === "fr";
  const data = await getPassByCode(code).catch(() => null);
  if (!data?.pass?.valid || !data.pass.ticketCode) {
    notFound();
  }

  const { pass, edition } = data;
  const passUrl = passPublicUrl(pass.ticketCode);
  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");
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
        <HackathonPassBadge
          kind={kind}
          isFr={isFr}
          passUrl={passUrl}
          ticketCode={pass.ticketCode}
          displayName={pass.displayName}
          orgOrEmail={pass.orgOrEmail}
          venue={venue}
          datesLabel={isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN}
          editionTitle={editionName}
        />

        <p className="mt-6 text-center text-xs text-[#8A8A8A]">
          <Link
            href="/hackathon"
            className="font-semibold text-[#1F6B43] hover:underline"
          >
            ← {isFr ? "Retour au Hackathon" : "Back to Hackathon"}
          </Link>
        </p>
      </div>
    </div>
  );
}
