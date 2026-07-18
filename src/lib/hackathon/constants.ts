import type {
  HackathonDisplayStats,
  HackathonGalleryItem,
  HackathonPrizeCategory,
  HackathonProgramDay,
} from "@/db/schema";
import { expandedFaq } from "@/lib/hackathon/landing-copy";

export const HACKATHON_PARTNERSHIP_TYPES = [
  "lieu",
  "internet",
  "communication",
  "jury",
  "mentorat",
  "incubation",
  "formation",
  "recrutement",
  "autre",
] as const;

export const HACKATHON_SPONSOR_PACKS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "custom",
] as const;

export const HACKATHON_PAYMENT_METHODS = [
  "orange",
  "mpesa",
  "airtel",
  "card",
  "usdt",
] as const;

export type HackathonPaymentMethod =
  (typeof HACKATHON_PAYMENT_METHODS)[number];

export function defaultProgram(): HackathonProgramDay[] {
  return [
    {
      day: 1,
      titleFr: "Jour 1 — Bootcamp Vibe Coding",
      titleEn: "Day 1 — Vibe Coding Bootcamp",
      itemsFr: [
        "Introduction au Vibe Coding",
        "ChatGPT",
        "Cursor",
        "Lovable",
        "Bolt",
        "Création d'une application",
        "Déploiement",
      ],
      itemsEn: [
        "Introduction to Vibe Coding",
        "ChatGPT",
        "Cursor",
        "Lovable",
        "Bolt",
        "Build an application",
        "Deployment",
      ],
    },
    {
      day: 2,
      titleFr: "Jour 2 — Hackathon",
      titleEn: "Day 2 — Hackathon",
      itemsFr: [
        "Les équipes développent leur projet",
        "Présentation devant le jury",
        "Remise des prix",
      ],
      itemsEn: [
        "Teams build their project",
        "Jury presentations",
        "Awards ceremony",
      ],
    },
  ];
}

export function defaultPrizes(): HackathonPrizeCategory[] {
  return [
    { id: "best_app", labelFr: "Meilleure application", labelEn: "Best application" },
    { id: "innovation", labelFr: "Innovation", labelEn: "Innovation" },
    { id: "social_impact", labelFr: "Impact social", labelEn: "Social impact" },
    { id: "ai", labelFr: "Intelligence artificielle", labelEn: "Artificial intelligence" },
    { id: "fintech", labelFr: "FinTech", labelEn: "FinTech" },
    { id: "govtech", labelFr: "GovTech", labelEn: "GovTech" },
    { id: "education", labelFr: "Éducation", labelEn: "Education" },
    { id: "health", labelFr: "Santé", labelEn: "Health" },
    { id: "agriculture", labelFr: "Agriculture", labelEn: "Agriculture" },
    { id: "media", labelFr: "Médias", labelEn: "Media" },
    { id: "cyber", labelFr: "Cybersécurité", labelEn: "Cybersecurity" },
  ];
}

export function emptyStats(): HackathonDisplayStats {
  return {
    participants: 0,
    teams: 0,
    hackathons: 1,
    projects: 0,
    partners: 0,
    sponsors: 0,
  };
}

export type HackathonFaqItem = { q: string; a: string };

export function defaultFaq(isFr: boolean): HackathonFaqItem[] {
  return expandedFaq(isFr);
}

export type { HackathonGalleryItem };
