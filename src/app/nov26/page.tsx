import type { Metadata } from "next";
import { Nov26LandingClient } from "@/components/nov26/nov26-landing-client";
import {
  getHackathonEditionBySlug,
  NOV26_EDITION_SLUG,
} from "@/lib/hackathon/editions";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import {
  NOV26_POSTER_PATH,
  NOV26_PRICE_USD,
  NOV26_TAGLINE_FR,
  NOV26_TITLE_FR,
} from "@/lib/nov26/content";

export const dynamic = "force-dynamic";

const PATH = "/nov26";
const TITLE = "Formation IA McBuleli · Nov 2026 | En ligne";
const DESCRIPTION = NOV26_TAGLINE_FR;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${CANONICAL_PRODUCTION_ORIGIN}${PATH}` },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    alternateLocale: ["en_US"],
    url: `${CANONICAL_PRODUCTION_ORIGIN}${PATH}`,
    siteName: "McBuleli",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: `${CANONICAL_PRODUCTION_ORIGIN}${NOV26_POSTER_PATH}`,
        width: 1080,
        height: 1350,
        alt: NOV26_TITLE_FR,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${CANONICAL_PRODUCTION_ORIGIN}${NOV26_POSTER_PATH}`],
  },
  robots: { index: true, follow: true },
};

export default async function Nov26Page() {
  let edition = null;
  try {
    edition = await getHackathonEditionBySlug(NOV26_EDITION_SLUG);
  } catch (e) {
    console.error("[nov26] edition load failed", e);
  }

  const priceUsd = edition?.priceFullUsd
    ? String(edition.priceFullUsd)
    : NOV26_PRICE_USD;
  const registrationOpen = edition?.status === "open";

  return (
    <Nov26LandingClient
      editionId={edition?.id ?? null}
      registrationOpen={registrationOpen}
      priceUsd={priceUsd}
    />
  );
}
