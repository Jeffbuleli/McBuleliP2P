/**
 * Static Mur Live content (défis, prix, partenaires, repères pratiques).
 * Served with the live payload so the projector needs no extra fetches.
 */
import {
  hackathonFeaturedPartners,
  podiumPrizes,
} from "@/lib/hackathon/event-content";
import { HACKATHON_PRACTICAL_SECTIONS } from "@/lib/hackathon/practical-info";
import { CANONICAL_CHALLENGES } from "@/lib/hackathon/team-formation";

export type LiveWallChallenge = {
  slug: string;
  labelFr: string;
  labelEn: string;
  blurbFr: string;
  blurbEn: string;
};

export type LiveWallPrize = {
  id: string;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

export type LiveWallPartnerLogo = {
  id: string;
  name: string;
  logoUrl: string;
};

export type LiveWallHighlight = {
  id: string;
  labelFr: string;
  labelEn: string;
};

export type LiveWallContent = {
  challenges: LiveWallChallenge[];
  prizes: LiveWallPrize[];
  partnerLogos: LiveWallPartnerLogo[];
  highlights: LiveWallHighlight[];
};

function practicalItems(sectionId: string): { fr: string[]; en: string[] } {
  const section = HACKATHON_PRACTICAL_SECTIONS.find((s) => s.id === sectionId);
  return {
    fr: section?.itemsFr ?? [],
    en: section?.itemsEn ?? [],
  };
}

/** Curated tips for the long build block on the room wall. */
export function buildLiveWallContent(): LiveWallContent {
  const wifi = practicalItems("wifi");
  const tools = practicalItems("tools");
  const rules = practicalItems("rules");

  const highlights: LiveWallHighlight[] = [
    {
      id: "deadline",
      labelFr: "Livrables : déposez démo + GitHub avant 15h30 - pitch PDF avant 16h00",
      labelEn: "Deliverables: demo + GitHub before 3:30 PM - pitch PDF before 4:00 PM",
    },
    {
      id: "mentor",
      labelFr:
        tools.fr[2] ??
        "Demande mentorat : Mon espace → onglet Build (file partenaires en salle)",
      labelEn:
        tools.en[2] ??
        "Mentor request: My hub → Build tab (partner queue on the floor)",
    },
    {
      id: "wifi",
      labelFr: wifi.fr[0] ?? "WiFi Silikin - hotspot de secours recommandé",
      labelEn: wifi.en[0] ?? "Silikin WiFi - backup hotspot recommended",
    },
    {
      id: "apis",
      labelFr: wifi.fr[2] ?? "APIs sandbox pawaPay & Binance demo",
      labelEn: wifi.en[2] ?? "Sandbox APIs pawaPay & Binance demo",
    },
    {
      id: "rules",
      labelFr: rules.fr[0] ?? "Respect du chrono et des autres équipes",
      labelEn: rules.en[0] ?? "Respect the schedule and other teams",
    },
    {
      id: "badge",
      labelFr: rules.fr[1] ?? "Badge QR visible en permanence",
      labelEn: rules.en[1] ?? "QR badge visible at all times",
    },
  ];

  return {
    challenges: CANONICAL_CHALLENGES.map((c) => ({
      slug: c.slug,
      labelFr: c.labelFr,
      labelEn: c.labelEn,
      blurbFr: c.blurbFr,
      blurbEn: c.blurbEn,
    })),
    prizes: podiumPrizes(true).map((p) => ({
      id: p.id,
      titleFr: p.titleFr,
      titleEn: p.titleEn,
      bodyFr: p.bodyFr,
      bodyEn: p.bodyEn,
    })),
    partnerLogos: hackathonFeaturedPartners().map((p) => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
    })),
    highlights,
  };
}

/** Map rank → named prize for podium mode. */
export const PODIUM_PRIZE_BY_RANK: Record<
  number,
  { titleFr: string; titleEn: string }
> = {
  1: { titleFr: "Prix ILOKWE", titleEn: "ILOKWE Prize" },
  2: { titleFr: "Deuxième Prix", titleEn: "Second Prize" },
  3: { titleFr: "Troisième Prix", titleEn: "Third Prize" },
};
