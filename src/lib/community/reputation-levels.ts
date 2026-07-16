export type ReputationLevelId =
  | "member"
  | "contributor"
  | "expert"
  | "trainer"
  | "pillar";

export type ReputationLevel = {
  id: ReputationLevelId;
  labelFr: string;
  labelEn: string;
  minScore: number;
};

export const REPUTATION_LEVELS: ReputationLevel[] = [
  { id: "member", labelFr: "Membre", labelEn: "Member", minScore: 0 },
  {
    id: "contributor",
    labelFr: "Contributeur",
    labelEn: "Contributor",
    minScore: 50,
  },
  { id: "expert", labelFr: "Expert", labelEn: "Expert", minScore: 150 },
  {
    id: "trainer",
    labelFr: "Formateur",
    labelEn: "Trainer",
    minScore: 300,
  },
  /**
   * Top earned reputation (effort / BP quality) — NOT a company mandate.
   * Official field roles use Ambassadeur / Représentant (charter), not this label.
   * Legacy id `ambassador` is normalized in `normalizeReputationLevelId`.
   */
  {
    id: "pillar",
    labelFr: "Pillier",
    labelEn: "Pillar",
    minScore: 600,
  },
];

/** Map legacy stored ids → current ladder. */
export function normalizeReputationLevelId(
  id: string | null | undefined,
): ReputationLevelId {
  if (id === "ambassador") return "pillar";
  if (
    id === "member" ||
    id === "contributor" ||
    id === "expert" ||
    id === "trainer" ||
    id === "pillar"
  ) {
    return id;
  }
  return "member";
}

export function reputationLevelFromScore(
  score: number,
): ReputationLevel {
  let level = REPUTATION_LEVELS[0]!;
  for (const l of REPUTATION_LEVELS) {
    if (score >= l.minScore) level = l;
  }
  return level;
}
