import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonPassView } from "@/components/hackathon/hackathon-pass-view";
import type { HackathonBadgeKind } from "@/components/hackathon/hackathon-pass-badge";
import { HACKATHON_VENUE_SILIKIN } from "@/lib/hackathon/constants";
import {
  canViewPass,
  getPassByCode,
  passPublicUrl,
} from "@/lib/hackathon/access";
import { loginHrefFor } from "@/lib/auth-return-path";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Badge Hackathon - McBuleli",
  robots: { index: false, follow: false },
};

const BADGE_KINDS = new Set([
  "participant",
  "partner",
  "speaker",
  "mentor",
  "jury",
  "sponsor",
  "organizer",
  "vip",
  "media",
  "ticket",
]);

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
  const access = await canViewPass(pass);
  if (!access.ok) {
    if (access.reason === "login_required") {
      redirect(loginHrefFor(`/hackathon/pass/${encodeURIComponent(pass.ticketCode)}`));
    }
    return (
      <div className="min-h-dvh">
        <LandingTopBar authReturnPath="/hackathon" />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-[color:var(--fd-fg)]">
            Accès réservé au propriétaire
          </h1>
          <p className="mt-3 text-sm text-[color:var(--fd-muted)]">
            Ce badge / ticket officiel n&apos;est visible qu&apos;avec le compte
            McBuleli lié à l&apos;email du titulaire. Connectez-vous avec le bon
            email, ou demandez au titulaire de vous octroyer la 2e place depuis
            l&apos;espace partenaires.
          </p>
          <p className="mt-6">
            <Link
              href="/hackathon/chat"
              className="font-semibold text-[color:var(--fd-primary)] underline"
            >
              Espace partenaires
            </Link>
          </p>
        </main>
      </div>
    );
  }

  const passUrl = passPublicUrl(pass.ticketCode);
  const venue =
    edition?.venue && !/confirmer|tbd|tba/i.test(edition.venue)
      ? edition.venue
      : HACKATHON_VENUE_SILIKIN;

  const rawKind = pass.badgeKind ?? (pass.subjectType === "partner" ? "partner" : "ticket");
  const kind: HackathonBadgeKind = BADGE_KINDS.has(rawKind)
    ? (rawKind as HackathonBadgeKind)
    : pass.subjectType === "partner"
      ? "partner"
      : "ticket";

  return (
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon" />
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-10">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
          Accès exclusif propriétaire · QR pour contrôle à la porte
        </p>
        <HackathonPassView
          kind={kind}
          passUrl={passUrl}
          ticketCode={pass.ticketCode}
          displayName={pass.displayName}
          orgOrEmail={pass.orgOrEmail}
          roleLabel={pass.roleLabel}
          venue={venue}
          editionNameFr={edition?.nameFr ?? "McBuleli Hackathon"}
          editionNameEn={edition?.nameEn ?? "McBuleli Hackathon"}
        />
      </div>
    </div>
  );
}
