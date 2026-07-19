import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "react-qr-code";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import { getLocale } from "@/lib/get-locale";
import { HACKATHON_VENUE_SILIKIN } from "@/lib/hackathon/constants";
import { getTicketByCode, ticketPublicUrl } from "@/lib/hackathon/service";
import { SUPPORT_X } from "@/lib/support-contact";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ticket Hackathon - McBuleli",
  robots: { index: false, follow: false },
};

export default async function HackathonTicketPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const isFr = locale === "fr";
  const data = await getTicketByCode(code).catch(() => null);
  if (!data || data.registration.paymentStatus !== "paid" || !data.registration.ticketCode) {
    notFound();
  }

  const { registration: reg, edition } = data;
  const ticketCode = data.registration.ticketCode;
  const ticketUrl = ticketPublicUrl(ticketCode);
  const editionName = isFr
    ? (edition?.nameFr ?? "McBuleli Hackathon")
    : (edition?.nameEn ?? "McBuleli Hackathon");
  const venue =
    edition?.venue && !/confirmer|tbd|tba/i.test(edition.venue)
      ? edition.venue
      : HACKATHON_VENUE_SILIKIN;

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
            {isFr ? "Ticket officiel" : "Official ticket"}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{editionName}</p>

          <div className="relative mx-auto mt-6 flex w-fit justify-center rounded-2xl bg-[color:var(--fd-mint)] p-4">
            <QRCode value={ticketUrl} size={180} bgColor="transparent" fgColor="#305f33" />
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
            {ticketCode}
          </p>
          <p className="mt-3 text-base font-semibold text-[color:var(--fd-text)]">
            {reg.firstName} {reg.lastName}
          </p>
          <p className="mt-1 text-xs text-[color:var(--fd-muted)]">{reg.email}</p>
          {reg.phone ? (
            <p className="text-xs text-[color:var(--fd-muted)]">{reg.phone}</p>
          ) : null}
          <p className="mt-3 text-sm font-semibold text-[color:var(--fd-text)]">
            {reg.ticketPack === "day1"
              ? isFr
                ? "Pack 1 jour"
                : "1-day pack"
              : isFr
                ? "Pack 2 jours + Hackathon"
                : "2-day + Hackathon pack"}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[color:var(--fd-muted)]">
            {venue}
            <br />
            Kinshasa · {isFr ? "Date : Bientôt" : "Date: Coming soon"}
          </p>
        </div>

        <a
          href={SUPPORT_X}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[color:var(--fd-text)]"
        >
          <span className="text-xs font-medium text-[color:var(--fd-muted)]">Powered by</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BRAND_LOGO_256} alt="" width={22} height={22} className="h-full w-full object-contain p-0.5" />
          </span>
          <span>McBuleli</span>
        </a>

        <p className="mt-4 text-center text-xs text-[color:var(--fd-muted)]">
          <Link href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            ← {isFr ? "Retour au Hackathon" : "Back to Hackathon"}
          </Link>
        </p>
      </div>
    </div>
  );
}
