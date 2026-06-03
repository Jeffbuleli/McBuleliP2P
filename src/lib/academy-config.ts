/** McBuleli Academy — catalog slugs & attendance windows. */

export const ACADEMY_PROGRAM_LAUNCH = "launch-crypto-trading-ia-p2p";
export const ACADEMY_PROGRAM_PRO = "crypto-trading-pro";
export const ACADEMY_EDITION_JUNE_2026 = "juin-2026";
export const ACADEMY_EDITION_PRO_Q3 = "q3-2026";
export const ACADEMY_QUIZ_FUNDAMENTALS = "fondamentaux";

/** Minutes before/after session start when live check-in is allowed. */
export const ACADEMY_CHECKIN_WINDOW_MIN = 20;

export const ACADEMY_LEVELS = [
  "discovery",
  "foundation",
  "pro",
  "expert",
] as const;

export type AcademyLevel = (typeof ACADEMY_LEVELS)[number];

export const ACADEMY_EDITION_STATUSES = [
  "draft",
  "open",
  "active",
  "closed",
] as const;
