/**
 * Canonical hackathon challenges (3 tracks) and team formation rules.
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
 * 8 marketing categories → 3 competition tracks.
 * ~4 teams per track when soft max = 12.
 */
export const CANONICAL_CHALLENGES: CanonicalChallenge[] = [
  {
    slug: "fintech",
    labelFr: "FinTech & inclusion",
    labelEn: "FinTech & inclusion",
    blurbFr:
      "Paiements, mobile money, crypto et inclusion financière (ex-FinTech).",
    blurbEn:
      "Payments, mobile money, crypto and financial inclusion (ex-FinTech).",
    absorbs: ["fintech"],
  },
  {
    slug: "agrotech",
    labelFr: "AgroTech & économie réelle",
    labelEn: "AgroTech & real economy",
    blurbFr:
      "Chaîne agricole et valorisation du terroir - référence ILOKWE (ex-AgroTech).",
    blurbEn:
      "Agricultural chain and terroir value - ILOKWE reference (ex-AgroTech).",
    absorbs: ["agriculture"],
  },
  {
    slug: "ai-society",
    labelFr: "IA pour services & société",
    labelEn: "AI for services & society",
    blurbFr:
      "IA utile, GovTech, santé, éducation, médias et cybersécurité (ex-IA / Gov / Health / Edu / Media / Cyber).",
    blurbEn:
      "Useful AI, GovTech, health, education, media and cyber (ex-AI / Gov / Health / Edu / Media / Cyber).",
    absorbs: ["ai", "govtech", "health", "education", "media", "cyber"],
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
