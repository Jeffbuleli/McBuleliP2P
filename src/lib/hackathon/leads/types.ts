/**
 * Shared constants & types for Hackathon lead-gen campaigns.
 * Safe for client + server (no Node-only imports).
 */

export const HACKATHON_LEAD_CATEGORIES = [
  "A_HOT",
  "B_QUALIFIED",
  "C_LOW",
  "UNQUALIFIED",
] as const;

export type HackathonLeadCategory =
  (typeof HACKATHON_LEAD_CATEGORIES)[number];

export const HACKATHON_LEAD_SEGMENTS = [
  "developers",
  "ai_data",
  "design_product",
  "entrepreneurs",
  "general",
] as const;

export type HackathonLeadSegment =
  (typeof HACKATHON_LEAD_SEGMENTS)[number];

export const HACKATHON_LEAD_PRIORITIES = [
  "hot",
  "high",
  "medium",
  "low",
  "none",
] as const;

export type HackathonLeadPriority =
  (typeof HACKATHON_LEAD_PRIORITIES)[number];

export const HACKATHON_LEAD_LIFECYCLES = [
  "LEAD",
  "QUALIFIED",
  "CONTACTED",
  "EMAIL_DELIVERED",
  "OPENED",
  "CLICKED",
  "INTERESTED",
  "REGISTERED",
  "PAID",
  "CONFIRMED",
] as const;

export type HackathonLeadLifecycle =
  (typeof HACKATHON_LEAD_LIFECYCLES)[number];

export const HACKATHON_LEAD_SOURCES = [
  "linkedin",
  "university",
  "community",
  "company",
  "ambassador",
  "email_campaign",
  "csv",
  "xlsx",
  "manual",
  "annuaire",
  "fec",
  "directory",
  "other",
] as const;

export type HackathonLeadSource = (typeof HACKATHON_LEAD_SOURCES)[number];

export const HACKATHON_CAMPAIGN_STATUSES = [
  "DRAFT",
  "READY_FOR_REVIEW",
  "APPROVED",
  "SENDING",
  "SENT",
  "PAUSED",
  "COMPLETED",
  "FAILED",
] as const;

export type HackathonCampaignStatus =
  (typeof HACKATHON_CAMPAIGN_STATUSES)[number];

export const HACKATHON_CAMPAIGN_SEGMENTS = [
  ...HACKATHON_LEAD_SEGMENTS,
  "mixed",
] as const;

export type HackathonCampaignSegment =
  (typeof HACKATHON_CAMPAIGN_SEGMENTS)[number];

export const HACKATHON_RECIPIENT_STATUSES = [
  "PENDING",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "FAILED",
  "SKIPPED",
  "BOUNCED",
  "UNSUBSCRIBED",
] as const;

export type HackathonRecipientStatus =
  (typeof HACKATHON_RECIPIENT_STATUSES)[number];

export const HACKATHON_RECIPIENT_SKIP_REASONS = [
  "already_registered",
  "suppressed",
  "invalid_email",
  "duplicate",
  "no_consent",
] as const;

export type HackathonRecipientSkipReason =
  (typeof HACKATHON_RECIPIENT_SKIP_REASONS)[number];

export const HACKATHON_SUPPRESSION_REASONS = [
  "unsubscribe",
  "bounce",
  "manual",
  "complaint",
] as const;

export type HackathonSuppressionReason =
  (typeof HACKATHON_SUPPRESSION_REASONS)[number];

export const HACKATHON_CAMPAIGN_EVENT_TYPES = [
  "IMPORTED",
  "SCORED",
  "SEGMENTED",
  "EMAIL_GENERATED",
  "TEST_SENT",
  "APPROVED",
  "QUEUED",
  "SENT",
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "UNSUBSCRIBED",
  "REGISTERED",
  "PAID",
  "CONFIRMED",
  "ERROR",
  "PAUSED",
  "RESUMED",
] as const;

export type HackathonCampaignEventType =
  (typeof HACKATHON_CAMPAIGN_EVENT_TYPES)[number];

/** Deterministic scoring criterion keys (Phase 5). */
export const HACKATHON_SCORE_CRITERIA = [
  "kinshasa",
  "developer",
  "ai_data",
  "ai_tools",
  "hackathon_exp",
  "startup",
  "recent_activity",
  "experience_1_7",
  "design_product",
] as const;

export type HackathonScoreCriterionKey =
  (typeof HACKATHON_SCORE_CRITERIA)[number];

/**
 * Kinshasa-first scoring for B2B SI desks (tech OR non-tech PME/grandes entreprises).
 * Tech keywords remain a bonus; having a Kinshasa org with digital/SI footprint is enough for B.
 */
export const HACKATHON_SCORE_POINTS: Record<
  HackathonScoreCriterionKey,
  number
> = {
  kinshasa: 30,
  developer: 20,
  ai_data: 15,
  ai_tools: 10,
  hackathon_exp: 10,
  startup: 10,
  recent_activity: 10,
  experience_1_7: 5,
  design_product: 15,
};

/** Kinshasa + SI/entreprise footprint → B_QUALIFIED; tech stack pushes A_HOT. */
export function categoryFromScore(score: number): HackathonLeadCategory {
  if (score >= 70) return "A_HOT";
  if (score >= 35) return "B_QUALIFIED";
  if (score >= 15) return "C_LOW";
  return "UNQUALIFIED";
}

export function priorityFromCategory(
  category: HackathonLeadCategory,
): HackathonLeadPriority {
  switch (category) {
    case "A_HOT":
      return "hot";
    case "B_QUALIFIED":
      return "high";
    case "C_LOW":
      return "medium";
    default:
      return "low";
  }
}

/** Statuses that allow mass send ticks (never DRAFT / READY_FOR_REVIEW). */
export const HACKATHON_CAMPAIGN_SENDABLE_STATUSES = [
  "APPROVED",
  "SENDING",
] as const satisfies readonly HackathonCampaignStatus[];

export function canLaunchCampaign(status: string): boolean {
  return status === "APPROVED";
}

/** True while progressive send may dequeue recipients (not while paused). */
export function canSendCampaignTick(status: string): boolean {
  return status === "APPROVED" || status === "SENDING";
}
