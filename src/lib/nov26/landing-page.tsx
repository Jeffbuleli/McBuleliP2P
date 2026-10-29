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

const CANONICAL_LANDING = "/nov26";

export function buildNov26LandingMetadata(pathForOg: string): Metadata {
  const TITLE = "Formation IA McBuleli · Nov 2026 | En ligne";
  const DESCRIPTION = NOV26_TAGLINE_FR;
  const canonical = `${CANONICAL_PRODUCTION_ORIGIN}${CANONICAL_LANDING}`;
  const ogUrl = `${CANONICAL_PRODUCTION_ORIGIN}${pathForOg}`;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "fr_CD",
      alternateLocale: ["en_US"],
      url: ogUrl,
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
}

type LandingProps = {
  /** URL path prefix, e.g. /nov26 or /hackathon/nov26 */
  basePath: string;
  /** Ignored today — canonical always /nov26 for SEO */
  canonicalPath?: string;
};

export async function Nov26LandingPage({ basePath }: LandingProps) {
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
      basePath={basePath}
      editionId={edition?.id ?? null}
      registrationOpen={registrationOpen}
      priceUsd={priceUsd}
    />
  );
}
