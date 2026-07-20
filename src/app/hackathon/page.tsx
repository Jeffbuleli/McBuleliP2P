import type { Metadata } from "next";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonLanding } from "@/components/hackathon/hackathon-landing";
import { getLocale } from "@/lib/get-locale";
import {
  demoFeaturedHackathon,
  getFeaturedHackathon,
} from "@/lib/hackathon/service";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { SUPPORT_EMAIL, SUPPORT_PHONE_DISPLAY } from "@/lib/support-contact";

export const dynamic = "force-dynamic";

const TITLE =
  "McBuleli Hackathon - Hackathon IA de référence en RDC | Kinshasa";
const DESCRIPTION =
  "Hackathon et bootcamp IA organisés par McBuleli à Kinshasa. Vibe Coding, défis FinTech, Santé, Agriculture, pitch jury, incubation. Inscrivez-vous ou devenez partenaire.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "Hackathon IA RDC",
    "Hackathon Kinshasa",
    "McBuleli",
    "Vibe Coding",
    "Bootcamp IA Congo",
    "FinTech Africa",
    "AI hackathon DRC",
  ],
  alternates: { canonical: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon` },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    alternateLocale: ["en_US"],
    url: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon`,
    siteName: "McBuleli",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${CANONICAL_PRODUCTION_ORIGIN}/brand/logo-512.png`,
        width: 512,
        height: 512,
        alt: "McBuleli Hackathon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    site: "@McBuleli",
    creator: "@McBuleli",
    images: [`${CANONICAL_PRODUCTION_ORIGIN}/brand/logo-512.png`],
  },
  robots: { index: true, follow: true },
};

function eventJsonLd(data: NonNullable<Awaited<ReturnType<typeof getFeaturedHackathon>>>) {
  const e = data.edition;
  const start = e.startDate ?? undefined;
  const end = e.endDate ?? e.startDate ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.nameFr,
    alternateName: e.nameEn,
    description: DESCRIPTION,
    eventStatus:
      e.status === "closed"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon`,
    image: [`${CANONICAL_PRODUCTION_ORIGIN}/brand/logo-512.png`],
    ...(start ? { startDate: start } : {}),
    ...(end ? { endDate: end } : {}),
    location: {
      "@type": "Place",
      name: e.venue && !/confirmer|tbd|tba/i.test(e.venue) ? e.venue : e.city,
      address: {
        "@type": "PostalAddress",
        addressLocality: e.city,
        addressCountry: "CD",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "McBuleli",
      url: CANONICAL_PRODUCTION_ORIGIN,
      email: SUPPORT_EMAIL,
      telephone: SUPPORT_PHONE_DISPLAY,
    },
    offers: [
      {
        "@type": "Offer",
        name: "McBuleli Hackathon - 3 jours",
        price: e.priceFullUsd,
        priceCurrency: "USD",
        availability:
          e.status === "open"
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
        url: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon#register`,
      },
    ],
  };
}

export default async function HackathonPage() {
  const locale = await getLocale();
  const isFr = locale === "fr";
  let data = null;
  let usedDemo = false;
  try {
    data = await getFeaturedHackathon();
  } catch (err) {
    console.error("[hackathon] getFeaturedHackathon failed", err);
    data = null;
  }

  if (!data && process.env.NODE_ENV !== "production") {
    data = demoFeaturedHackathon();
    usedDemo = true;
  }

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon" />
      {data ? (
        <>
          {usedDemo ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
              {isFr
                ? "Aperçu local (DB indisponible) - les formulaires ne s'enregistreront pas tant que DATABASE_URL / seed ne sont pas OK."
                : "Local preview (DB unavailable) - forms will not save until DATABASE_URL / seed are OK."}
            </div>
          ) : null}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(eventJsonLd(data)),
            }}
          />
          <HackathonLanding data={data} />
        </>
      ) : (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-[color:var(--fd-text)]">
            McBuleli Hackathon
          </h1>
          <p className="mt-3 text-sm text-[color:var(--fd-muted)]">
            {isFr
              ? "La prochaine édition arrive bientôt. Revenez dans quelques instants."
              : "The next edition is coming soon. Check back shortly."}
          </p>
        </div>
      )}
    </div>
  );
}
