/**
 * Personalized hackathon outreach copy from verified lead facts only.
 */

import { partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  renderMarketingBroadcastHtml,
  renderMarketingBroadcastText,
} from "@/lib/email/marketing-layout";
import type { HackathonLeadSegment } from "./types";

export const HACKATHON_CAMPAIGN_SLUG = "ai-hackathon-2026";

export const HACKATHON_EVENT_FACTS = {
  title: "HACKATHON AI KINSHASA",
  dates: "28–29 août 2026",
  hours: "08h00–17h00",
  venue: "Silikin Village — Kinshasa",
  themes: [
    "Artificial Intelligence",
    "Vibe Coding",
    "développement de prototypes",
    "collaboration en équipe",
    "résolution de problématiques réelles de Kinshasa",
  ],
} as const;

export type LeadPersonalizeInput = {
  firstName: string;
  lastName?: string | null;
  jobTitle?: string | null;
  company?: string | null;
  location?: string | null;
  skills?: string[] | null;
  segment: HackathonLeadSegment | string;
  recommendedProfile?: string | null;
  scoreBreakdownCriteria?: { key: string; label: string }[] | null;
};

export type PersonalizedEmail = {
  subject: string;
  html: string;
  text: string;
  facts: Record<string, string>;
  personalizationRate: number;
};

function clean(s: string | null | undefined, max = 120): string {
  return (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function segmentAngle(segment: string): {
  subjectHook: string;
  bodyHook: string;
  bullets: string[];
} {
  switch (segment) {
    case "developers":
      return {
        subjectHook: "Vibe Coding & prototypes IA",
        bodyHook:
          "Votre profil technique pourrait particulièrement correspondre à une compétition orientée développement, IA et création de prototypes en équipe.",
        bullets: [
          "Challenge technique et Vibe Coding",
          "Build de prototypes avec outils IA",
          "Travail en équipe sur des problèmes réels de Kinshasa",
        ],
      };
    case "ai_data":
      return {
        subjectHook: "IA, GenAI & données",
        bodyHook:
          "Votre intérêt pour l'IA / la data pourrait particulièrement correspondre à un hackathon centré sur GenAI, automatisation et solutions intelligentes pour Kinshasa.",
        bullets: [
          "IA & GenAI appliquées",
          "Automatisation et données",
          "Solutions intelligentes pour Kinshasa",
        ],
      };
    case "design_product":
      return {
        subjectHook: "design produit & UX",
        bodyHook:
          "Votre orientation produit / design pourrait particulièrement correspondre à un hackathon où l'on transforme une idée en prototype avec des développeurs.",
        bullets: [
          "Conception produit et UX/UI",
          "De l'idée au prototype",
          "Collaboration avec développeurs",
        ],
      };
    case "entrepreneurs":
      return {
        subjectHook: "innovation & équipes",
        bodyHook:
          "Votre profil entrepreneur / startup pourrait particulièrement correspondre à une opportunité de créer une solution, constituer une équipe et gagner en visibilité.",
        bullets: [
          "Innovation et création de solutions",
          "Networking et constitution d'équipes",
          "Visibilité pour votre structure",
        ],
      };
    default:
      return {
        subjectHook: "builder à Kinshasa",
        bodyHook:
          "Nous organisons un hackathon AI à Kinshasa pour des profils motivés à construire des solutions concrètes en équipe.",
        bullets: [
          "IA et Vibe Coding",
          "Prototypes en équipe",
          "Problématiques réelles de Kinshasa",
        ],
      };
  }
}

/** Build a natural sentence only from verified fields. */
function verifiedBridge(input: LeadPersonalizeInput): {
  sentence: string | null;
  facts: Record<string, string>;
} {
  const facts: Record<string, string> = {};
  const firstName = clean(input.firstName, 80) || "Bonjour";
  facts.firstName = firstName;

  const job = clean(input.jobTitle, 100);
  const company = clean(input.company, 100);
  const location = clean(input.location, 80);
  const skills = (input.skills ?? [])
    .map((s) => clean(s, 40))
    .filter(Boolean)
    .slice(0, 3);

  if (job) facts.jobTitle = job;
  if (company) facts.company = company;
  if (location) facts.location = location;
  if (skills.length) facts.skills = skills.join(", ");

  const parts: string[] = [];
  if (job && company) {
    parts.push(`votre expérience en tant que ${job} chez ${company}`);
  } else if (job) {
    parts.push(`votre expérience en tant que ${job}`);
  } else if (company) {
    parts.push(`votre lien avec ${company}`);
  }
  if (skills.length) {
    parts.push(`vos compétences (${skills.join(", ")})`);
  }
  if (location && /kinshasa/i.test(location)) {
    parts.push("votre ancrage à Kinshasa");
  }

  if (parts.length === 0) {
    return { sentence: null, facts };
  }

  const joined =
    parts.length === 1
      ? parts[0]!
      : `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;

  return {
    sentence: `${joined.charAt(0).toUpperCase()}${joined.slice(1)} pourraient particulièrement correspondre au ${HACKATHON_EVENT_FACTS.title}.`,
    facts,
  };
}

export function buildCampaignCtaUrl(args: {
  campaignSlug?: string;
  segment: string;
  clickToken?: string;
}): string {
  const base = partnershipPublicBaseUrl();
  const campaign = args.campaignSlug ?? HACKATHON_CAMPAIGN_SLUG;
  const params = new URLSearchParams({
    source: "email",
    campaign,
    segment: args.segment || "general",
  });
  if (args.clickToken) params.set("r", args.clickToken);
  return `${base}/hackathon?${params.toString()}`;
}

export function personalizeLeadEmail(args: {
  lead: LeadPersonalizeInput;
  unsubscribeUrl: string;
  ctaUrl: string;
  campaignName?: string;
}): PersonalizedEmail {
  const angle = segmentAngle(args.lead.segment);
  const bridge = verifiedBridge(args.lead);
  const facts = { ...bridge.facts, segment: String(args.lead.segment) };
  if (args.lead.recommendedProfile) {
    facts.recommendedProfile = clean(args.lead.recommendedProfile, 120);
  }

  const firstName = facts.firstName || "Bonjour";
  const subject = `${firstName}, ${HACKATHON_EVENT_FACTS.title} - ${angle.subjectHook}`;

  const paragraphs: string[] = [];
  if (bridge.sentence) {
    paragraphs.push(bridge.sentence);
  } else {
    paragraphs.push(angle.bodyHook);
  }
  paragraphs.push(
    `${HACKATHON_EVENT_FACTS.title} se tient les ${HACKATHON_EVENT_FACTS.dates} (${HACKATHON_EVENT_FACTS.hours}) à ${HACKATHON_EVENT_FACTS.venue}.`,
  );
  paragraphs.push(
    "L'objectif : construire des prototypes utiles avec l'IA, en équipe, sur des défis concrets de Kinshasa.",
  );

  const copy = {
    preheader: `${HACKATHON_EVENT_FACTS.dates} · ${HACKATHON_EVENT_FACTS.venue}`,
    headline: HACKATHON_EVENT_FACTS.title,
    paragraphs,
    bullets: [
      ...angle.bullets,
      ...HACKATHON_EVENT_FACTS.themes.slice(0, 2),
    ],
    dateHighlight: `${HACKATHON_EVENT_FACTS.dates} · ${HACKATHON_EVENT_FACTS.hours} · ${HACKATHON_EVENT_FACTS.venue}`,
    reassurance:
      "Organisé par McBuleli · Inscription sur mcbuleli.org/hackathon",
    ctaLabel: "Découvrir le Hackathon et s'inscrire",
    ctaHref: args.ctaUrl,
  };

  const html = renderMarketingBroadcastHtml({
    copy,
    locale: "fr",
    resendAudience: false,
    recipientFirstName: firstName === "Bonjour" ? undefined : firstName,
    unsubscribeHref: args.unsubscribeUrl,
  });
  const text = renderMarketingBroadcastText({
    copy,
    locale: "fr",
    resendAudience: false,
    recipientFirstName: firstName === "Bonjour" ? undefined : firstName,
    unsubscribeHref: args.unsubscribeUrl,
  });

  const possible = ["jobTitle", "company", "location", "skills", "firstName"];
  const used = possible.filter((k) => Boolean(facts[k]));
  const personalizationRate = Math.round((used.length / possible.length) * 100);

  return {
    subject,
    html,
    text,
    facts,
    personalizationRate,
  };
}
