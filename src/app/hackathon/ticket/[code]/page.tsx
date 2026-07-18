import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "react-qr-code";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getLocale } from "@/lib/get-locale";
import { getTicketByCode, ticketPublicUrl } from "@/lib/hackathon/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ticket Hackathon — McBuleli",
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

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon" />
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center shadow-sm">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli
          </p>
          <h1 className="mt-2 text-xl font-black text-[color:var(--fd-text)]">
            {isFr ? "Ticket officiel" : "Official ticket"}
          </h1>
          <p className="mt-1 text-sm text-[color:var(--fd-muted)]">{editionName}</p>

          <div className="mx-auto mt-6 flex justify-center rounded-2xl bg-[color:var(--fd-mint)] p-4">
            <QRCode value={ticketUrl} size={180} bgColor="transparent" fgColor="#305f33" />
          </div>

          <p className="mt-4 font-mono text-lg font-black tracking-wider text-[color:var(--fd-primary)]">
            {ticketCode}
          </p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--fd-text)]">
            {reg.firstName} {reg.lastName}
          </p>
          <p className="text-xs text-[color:var(--fd-muted)]">
            {reg.ticketPack === "day1"
              ? isFr
                ? "Pack 1 jour"
                : "1-day pack"
              : isFr
                ? "Pack 2 jours + Hackathon"
                : "2-day + Hackathon pack"}
          </p>
          {edition?.city ? (
            <p className="mt-3 text-xs text-[color:var(--fd-muted)]">
              {[edition.venue, edition.city].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>
        <p className="mt-6 text-center text-xs text-[color:var(--fd-muted)]">
          <Link href="/hackathon" className="font-semibold text-[color:var(--fd-primary)]">
            ← {isFr ? "Retour au Hackathon" : "Back to Hackathon"}
          </Link>
        </p>
      </div>
    </div>
  );
}
