import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Nov26EspaceClient } from "@/components/nov26/nov26-espace-client";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getNov26GoogleMeetUrl, NOV26_TAGLINE_FR } from "@/lib/nov26/content";
import { loadNov26HubForUser } from "@/lib/nov26/hub";
import { getSessionUser } from "@/lib/session-user";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace formation Nov 2026 | McBuleli",
  description: NOV26_TAGLINE_FR,
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${CANONICAL_PRODUCTION_ORIGIN}/nov26/espace`,
  },
};

export default async function Nov26EspacePage() {
  const user = await getSessionUser();
  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") || "/nov26/espace";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const hub = await loadNov26HubForUser(user.id);
  const meetUrl = hub?.paymentStatus === "paid" ? getNov26GoogleMeetUrl() : null;

  return (
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath="/nov26/espace" />
      <Nov26EspaceClient
        displayName={user.email}
        firstName={hub?.firstName}
        lastName={hub?.lastName}
        paymentStatus={hub?.paymentStatus ?? "none"}
        priceUsd={hub?.priceUsd}
        ticketCode={hub?.ticketCode ?? null}
        payUrl={hub?.payUrl ?? null}
        meetUrl={meetUrl}
      />
    </div>
  );
}
