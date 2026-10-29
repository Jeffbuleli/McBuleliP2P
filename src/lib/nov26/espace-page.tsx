import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Nov26EspaceClient } from "@/components/nov26/nov26-espace-client";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";
import { getNov26GoogleMeetUrl, NOV26_TAGLINE_FR } from "@/lib/nov26/content";
import { loadNov26HubForUser } from "@/lib/nov26/hub";
import { getSessionUser } from "@/lib/session-user";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

const CANONICAL_ESPACE = "/nov26/espace";

export function buildNov26EspaceMetadata(_pathForOg: string): Metadata {
  return {
    title: "Espace formation Nov 2026 | McBuleli",
    description: NOV26_TAGLINE_FR,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${CANONICAL_PRODUCTION_ORIGIN}${CANONICAL_ESPACE}`,
    },
  };
}

type EspaceProps = {
  basePath: string;
  authReturnPath: string;
};

export async function Nov26EspacePage({ basePath, authReturnPath }: EspaceProps) {
  const user = await getSessionUser();
  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") || authReturnPath;
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const hub = await loadNov26HubForUser(user.id);
  const emailAligned =
    hub &&
    canonicalEmailForDedup(user.email) === canonicalEmailForDedup(hub.email);
  const meetUrl =
    hub?.paymentStatus === "paid" && emailAligned
      ? getNov26GoogleMeetUrl()
      : null;

  return (
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath={authReturnPath} />
      <Nov26EspaceClient
        basePath={basePath}
        displayName={user.email}
        firstName={hub?.firstName}
        lastName={hub?.lastName}
        paymentStatus={hub?.paymentStatus ?? "none"}
        priceUsd={hub?.priceUsd}
        ticketCode={hub?.ticketCode ?? null}
        payUrl={hub?.payUrl ?? null}
        meetUrl={meetUrl}
        registrationEmail={hub?.email ?? null}
        accountEmailMatchesRegistration={emailAligned !== false}
      />
    </div>
  );
}
