"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  HackathonPassBadge,
  type HackathonBadgeKind,
} from "@/components/hackathon/hackathon-pass-badge";
import {
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_DATES_LABEL_FR,
} from "@/lib/hackathon/event-content";

type Props = {
  kind: HackathonBadgeKind;
  passUrl: string;
  ticketCode: string;
  displayName: string;
  orgOrEmail: string;
  venue: string;
  editionNameFr: string;
  editionNameEn: string;
};

/** Pass / ticket view — follows LangSwitch via useI18n (not SSR-frozen locale). */
export function HackathonPassView({
  kind,
  passUrl,
  ticketCode,
  displayName,
  orgOrEmail,
  venue,
  editionNameFr,
  editionNameEn,
}: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <>
      <HackathonPassBadge
        kind={kind}
        isFr={isFr}
        passUrl={passUrl}
        ticketCode={ticketCode}
        displayName={displayName}
        orgOrEmail={orgOrEmail}
        venue={venue}
        datesLabel={isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN}
        editionTitle={isFr ? editionNameFr : editionNameEn}
      />

      <p className="mt-6 text-center text-xs text-[#8A8A8A]">
        <Link
          href="/hackathon"
          className="font-semibold text-[#1F6B43] hover:underline"
        >
          ← {isFr ? "Retour au Hackathon" : "Back to Hackathon"}
        </Link>
      </p>
    </>
  );
}
