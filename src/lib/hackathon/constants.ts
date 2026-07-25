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
  "usdt",
] as const;

export type HackathonPaymentMethod =
  (typeof HACKATHON_PAYMENT_METHODS)[number];

/** Open-ended seat hold (no auto-expiry). Reminders every N hours via cron. */
export const HACKATHON_HOLD_EXPIRES = false;
/** Hours between payment reminder emails for reserved seats (cron). */
export const HACKATHON_REMINDER_HOURS = 24;
/** @deprecated kept for older callers - holds no longer expire */
export const HACKATHON_HOLD_HOURS = HACKATHON_REMINDER_HOURS;

/** Unique ticket price (USD) for the full 2-day program */
export const HACKATHON_PRICE_USD = "100";
/** Default pack - single full program (no day-1-only option) */
export const HACKATHON_DEFAULT_PACK = "full" as const;

/** Confirmed venue for Kinshasa editions */
export const HACKATHON_VENUE_SILIKIN =
  "Silikin Village, 63, Ave Colonel Mondjiba";

export function defaultProgram(): HackathonProgramDay[] {
  return [
    {
      day: 1,
      titleFr: "Jour 1 - Bootcamp, équipes & build",
      titleEn: "Day 1 - Bootcamp, teams & build",
      itemsFr: [
        "Bootcamp Vibe Coding (Design Thinking, Cursor, Claude, Codex)",
        "Formation des équipes et choix des défis",
        "Développement intensif",
        "Mentorat pendant le build",
      ],
      itemsEn: [
        "Vibe Coding bootcamp (Design Thinking, Cursor, Claude, Codex)",
        "Team formation and challenge selection",
        "Intensive development",
        "Mentoring during the build",
      ],
    },
    {
      day: 2,
      titleFr: "Jour 2 - Build, pitch, jury & prix",
      titleEn: "Day 2 - Build, pitch, jury & awards",
      itemsFr: [
        "Développement et mentorat",
        "Pitch & démonstration (Demo Day)",
        "Délibération du jury",
        "Remise des prix et clôture",
      ],
      itemsEn: [
        "Development and mentoring",
        "Pitch & demo (Demo Day)",
        "Jury deliberation",
        "Awards and closing",
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
    { id: "agriculture", labelFr: "AgroTech", labelEn: "AgroTech" },
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
