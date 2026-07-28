/**
 * Canonical hackathon challenges (4 tracks) and team formation rules.
 */

export const TEAM_ROLE_IDS = [
  "lead",
  "principal_dev",
  "design",
  "specialist",
  "presenter",
] as const;

export type TeamRoleId = (typeof TEAM_ROLE_IDS)[number];

export const TEAM_ROLE_META: Record<
  TeamRoleId,
  { labelFr: string; labelEn: string; shortFr: string; shortEn: string }
> = {
  lead: {
    labelFr: "Team Lead",
    labelEn: "Team Lead",
    shortFr: "Lead",
    shortEn: "Lead",
  },
  principal_dev: {
    labelFr: "Dev. principal",
    labelEn: "Principal developer",
    shortFr: "Dev",
    shortEn: "Dev",
  },
  design: {
    labelFr: "Designer / UI",
    labelEn: "Designer / UI",
    shortFr: "Design",
    shortEn: "Design",
  },
  specialist: {
    labelFr: "Spécialiste métier / IA",
    labelEn: "Domain / AI specialist",
    shortFr: "Métier/IA",
    shortEn: "Domain/AI",
  },
  presenter: {
    labelFr: "Présentateur (pitch)",
    labelEn: "Pitch presenter",
    shortFr: "Pitch",
    shortEn: "Pitch",
  },
};

/** Hard cap per team. */
export const TEAM_MAX_MEMBERS = 5;

/** Soft ceiling on number of teams before capacity expands. */
export const TEAM_SOFT_MAX_DEFAULT = 12;

/** Soft target size used for balancing (3 → 4 → 5 as capacity expands). */
export const TEAM_TARGET_SIZE_DEFAULT = 3;

export type CanonicalChallenge = {
  slug: string;
  labelFr: string;
  labelEn: string;
  blurbFr: string;
  blurbEn: string;
  /** Old category ids absorbed into this track. */
  absorbs: string[];
};

/**
 * 8 marketing categories → 4 competition tracks.
 * ~3 teams per track when soft max = 12.
 */
export const CANONICAL_CHALLENGES: CanonicalChallenge[] = [
  {
    slug: "fintech",
    labelFr: "FinTech & inclusion",
    labelEn: "FinTech & inclusion",
    blurbFr:
      "Paiements, mobile money, crypto et inclusion financière.",
    blurbEn:
      "Payments, mobile money, crypto and financial inclusion.",
    absorbs: ["fintech"],
  },
  {
    slug: "agrotech",
    labelFr: "AgroTech & économie réelle",
    labelEn: "AgroTech & real economy",
    blurbFr:
      "Chaîne agricole et valorisation du terroir — référence ILOKWE.",
    blurbEn:
      "Agricultural chain and terroir value — ILOKWE reference.",
    absorbs: ["agriculture"],
  },
  {
    slug: "health-edu",
    labelFr: "Santé & éducation",
    labelEn: "Health & education",
    blurbFr:
      "Accès aux soins, prévention, formation et outils d'apprentissage.",
    blurbEn:
      "Care access, prevention, training and learning tools.",
    absorbs: ["health", "education"],
  },
  {
    slug: "gov-cyber",
    labelFr: "GovTech, médias & cybersécurité",
    labelEn: "GovTech, media & cybersecurity",
    blurbFr:
      "Services publics, information fiable et confiance numérique (ex-IA / Gov / Médias / Cyber).",
    blurbEn:
      "Public services, trusted information and digital trust (ex-AI / Gov / Media / Cyber).",
    absorbs: ["ai", "govtech", "media", "cyber", "ai-society"],
  },
];

export function expandTeamCapacity(input: {
  softMaxTeams: number;
  targetTeamSize: number;
}): { softMaxTeams: number; targetTeamSize: number } {
  return {
    softMaxTeams: input.softMaxTeams + 4,
    targetTeamSize: Math.min(TEAM_MAX_MEMBERS, input.targetTeamSize + 1),
  };
}
