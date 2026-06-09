export type ReputationLevelId =
  | "member"
  | "contributor"
  | "expert"
  | "trainer"
  | "ambassador";

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
  {
    id: "ambassador",
    labelFr: "Ambassadeur",
    labelEn: "Ambassador",
    minScore: 600,
  },
];

export function reputationLevelFromScore(
  score: number,
): ReputationLevel {
  let level = REPUTATION_LEVELS[0]!;
  for (const l of REPUTATION_LEVELS) {
    if (score >= l.minScore) level = l;
  }
  return level;
}
