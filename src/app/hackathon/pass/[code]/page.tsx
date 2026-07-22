import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "react-qr-code";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
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
  const isPartner = pass.subjectType === "partner";
  const title = isPartner
    ? isFr
      ? "Badge partenaire"
      : "Partner badge"
    : isFr
      ? "Ticket officiel"
      : "Official ticket";
  const roleLine = isPartner
    ? isFr
      ? "Partenaire confirmé · accès 3 jours"
      : "Confirmed partner · 3-day access"
    : isFr
      ? "Programme 3 jours"
      : "3-day program";

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon" />
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BRAND_LOGO_256}
            alt="McBuleli"
            width={48}
            height={48}
            className="mx-auto h-12 w-12 rounded-xl"
          />
          <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
          <h1 className="mt-2 text-xl font-black text-[color:var(--fd-text)]">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{editionName}</p>

          <div className="relative mx-auto mt-6 flex w-fit justify-center rounded-2xl bg-[color:var(--fd-mint)] p-4">
            <QRCode value={passUrl} size={180} bgColor="transparent" fgColor="#305f33" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-white p-1 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND_LOGO_256}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-md"
                />
              </div>
            </div>
          </div>

          <p className="mt-4 font-mono text-lg font-black tracking-wider text-[color:var(--fd-primary)]">
            {pass.ticketCode}
          </p>
          <p className="mt-3 text-base font-semibold text-[color:var(--fd-text)]">
            {pass.displayName}
          </p>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{pass.orgOrEmail}</p>
          <p className="mt-3 text-sm font-semibold text-[color:var(--fd-text)]">
            {roleLine}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[color:var(--fd-muted)]">
            {venue}
            <br />
            Kinshasa · {isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN}
          </p>
          <p className="mt-4 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
            {isFr
              ? "Présentez ce QR à l'entrée. Valable les 3 jours du hackathon."
              : "Show this QR at the entrance. Valid for all 3 hackathon days."}
          </p>

          <HackathonPoweredBy className="mt-6" />
        </div>

        <p className="mt-4 text-center text-xs text-[color:var(--fd-muted)]">
          <Link href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            ← {isFr ? "Retour au Hackathon" : "Back to Hackathon"}
          </Link>
        </p>
      </div>
    </div>
  );
}
