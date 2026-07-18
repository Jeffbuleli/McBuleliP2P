import type {
  HackathonDisplayStats,
  HackathonGalleryItem,
  HackathonPrizeCategory,
  HackathonProgramDay,
} from "@/db/schema";

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
    { id: "ai", labelFr: "IA", labelEn: "AI" },
    { id: "fintech", labelFr: "Fintech", labelEn: "Fintech" },
    { id: "education", labelFr: "Education", labelEn: "Education" },
    { id: "health", labelFr: "Santé", labelEn: "Health" },
    { id: "agriculture", labelFr: "Agriculture", labelEn: "Agriculture" },
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
  if (isFr) {
    return [
      {
        q: "Qui peut participer ?",
        a: "Étudiants, builders, entrepreneurs et curieux — débutants bienvenus. Le Jour 1 pose les bases du Vibe Coding.",
      },
      {
        q: "Faut-il venir avec une équipe ?",
        a: "Non. Vous pouvez vous inscrire en solo et former une équipe sur place, ou arriver déjà en équipe.",
      },
      {
        q: "Que couvrent les tarifs ?",
        a: "1 jour (50 USD) : bootcamp. 2 jours + Hackathon (80 USD) : bootcamp, hackathon, pitch jury et certificat de participation.",
      },
      {
        q: "Comment payer ?",
        a: "Orange Money, M-Pesa, Airtel Money ou carte bancaire. Après paiement, vous recevez un ticket QR par e-mail.",
      },
      {
        q: "Où se déroule l'événement ?",
        a: "À Kinshasa pour cette édition. Le lieu exact est confirmé aux inscrits payés avant le Jour 1.",
      },
    ];
  }
  return [
    {
      q: "Who can join?",
      a: "Students, builders, founders and curious minds — beginners welcome. Day 1 covers Vibe Coding fundamentals.",
    },
    {
      q: "Do I need a team?",
      a: "No. Register solo and form a team on site, or arrive with a team already.",
    },
    {
      q: "What do the tickets include?",
      a: "1 day (50 USD): bootcamp. 2 days + Hackathon (80 USD): bootcamp, hackathon, jury pitch and participation certificate.",
    },
    {
      q: "How do I pay?",
      a: "Orange Money, M-Pesa, Airtel Money or card. After payment you get a QR ticket by email.",
    },
    {
      q: "Where is it held?",
      a: "Kinshasa for this edition. Exact venue is confirmed to paid attendees before Day 1.",
    },
  ];
}

export type { HackathonGalleryItem };
