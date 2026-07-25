/** Team lifecycle statuses for live wall (discrete events, not %). */
export const TEAM_STATUSES = [
  "forming",
  "ready",
  "building",
  "submitted",
  "presented",
  "judged",
] as const;

export type TeamStatus = (typeof TEAM_STATUSES)[number];

export const TEAM_STATUS_LABELS_FR: Record<TeamStatus, string> = {
  forming: "Formation d'équipe",
  ready: "Équipe prête (défi + règlement)",
  building: "Développement",
  submitted: "Livrables / prêt pitch",
  presented: "Pitch effectué",
  judged: "Jury terminé",
};

export const TEAM_STATUS_LABELS_EN: Record<TeamStatus, string> = {
  forming: "Team forming",
  ready: "Team ready (challenge + rules)",
  building: "Development",
  submitted: "Deliverables / pitch ready",
  presented: "Pitched",
  judged: "Judged",
};

/** Jury criteria weights (must sum to 1). Scores are 0–10. */
export const JURY_CRITERIA = [
  { id: "innovation" as const, weight: 0.25, labelFr: "Innovation", labelEn: "Innovation" },
  { id: "impact" as const, weight: 0.25, labelFr: "Impact", labelEn: "Impact" },
  { id: "technical" as const, weight: 0.2, labelFr: "Qualité technique", labelEn: "Technical quality" },
  { id: "business" as const, weight: 0.15, labelFr: "Business model", labelEn: "Business model" },
  { id: "presentation" as const, weight: 0.15, labelFr: "Présentation", labelEn: "Presentation" },
];

export type JuryCriterionId = (typeof JURY_CRITERIA)[number]["id"];

/** Weighted total 0–100 from criterion scores 0–10. */
export function computeWeightedScore(
  scores: Partial<Record<JuryCriterionId, number>>,
): number | null {
  let total = 0;
  let covered = 0;
  for (const c of JURY_CRITERIA) {
    const s = scores[c.id];
    if (typeof s !== "number" || Number.isNaN(s)) continue;
    total += (s / 10) * c.weight * 100;
    covered += 1;
  }
  if (covered !== JURY_CRITERIA.length) return null;
  return Math.round(total * 10) / 10;
}

export const MAX_TEAM_MEMBERS = 5;
export const MIN_TEAM_MEMBERS_NON_SOLO = 1;

// Re-export formation constants for callers that imported from team-status.
export {
  TEAM_MAX_MEMBERS,
  TEAM_SOFT_MAX_DEFAULT,
  TEAM_TARGET_SIZE_DEFAULT,
} from "@/lib/hackathon/team-formation";
