/**
 * Forfaits « Live Studio » — config produit (Phase A monetization).
 * Débit wallet : même pattern que bot_subscription / academy enroll.
 */
export const ACADEMY_LIVE_PLAN_IDS = ["starter", "community", "campus"] as const;
export type AcademyLivePlanId = (typeof ACADEMY_LIVE_PLAN_IDS)[number];

export type AcademyLivePlanDef = {
  id: AcademyLivePlanId;
  labelFr: string;
  /** USDT per purchase (event or month). */
  priceUsdt: number;
  billing: "per_event" | "monthly";
  maxParticipants: number;
  maxMinutesPerSession: number;
  sessionsPerPeriod: number;
};

/** Prix volontairement bas — ajuster après métriques VPS. */
export const ACADEMY_LIVE_PLANS: Record<AcademyLivePlanId, AcademyLivePlanDef> = {
  starter: {
    id: "starter",
    labelFr: "Starter — 1 live",
    priceUsdt: 3,
    billing: "per_event",
    maxParticipants: 15,
    maxMinutesPerSession: 90,
    sessionsPerPeriod: 1,
  },
  community: {
    id: "community",
    labelFr: "Community — 4 lives / mois",
    priceUsdt: 12,
    billing: "monthly",
    maxParticipants: 35,
    maxMinutesPerSession: 120,
    sessionsPerPeriod: 4,
  },
  campus: {
    id: "campus",
    labelFr: "Campus — 8 lives / mois",
    priceUsdt: 28,
    billing: "monthly",
    maxParticipants: 60,
    maxMinutesPerSession: 180,
    sessionsPerPeriod: 8,
  },
};

export function isAcademyLivePlanId(v: string): v is AcademyLivePlanId {
  return (ACADEMY_LIVE_PLAN_IDS as readonly string[]).includes(v);
}

export function getAcademyLivePlan(id: AcademyLivePlanId): AcademyLivePlanDef {
  return ACADEMY_LIVE_PLANS[id];
}
