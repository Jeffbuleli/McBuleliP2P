/** Ambassadeur charter — company mandate (not a paid badge). */

export const AMBASSADOR_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  REJECTED: "rejected",
  REVOKED: "revoked",
} as const;

export type AmbassadorStatus =
  (typeof AMBASSADOR_STATUS)[keyof typeof AMBASSADOR_STATUS];

/** Bump when charter text changes; applicants must re-accept. */
export const AMBASSADOR_CHARTER_VERSION = "2026.07";

/** i18n keys for charter bullets (order matters). */
export const AMBASSADOR_CHARTER_BULLET_KEYS = [
  "amb_charter_b1",
  "amb_charter_b2",
  "amb_charter_b3",
  "amb_charter_b4",
  "amb_charter_b5",
] as const;

export function isAmbassadorApplicationsEnabled(): boolean {
  const v = process.env.AMBASSADOR_APPLICATIONS_ENABLED;
  if (v === "false" || v === "0") return false;
  return true;
}

export function isAmbassadorStatus(v: string): v is AmbassadorStatus {
  return (Object.values(AMBASSADOR_STATUS) as string[]).includes(v);
}
