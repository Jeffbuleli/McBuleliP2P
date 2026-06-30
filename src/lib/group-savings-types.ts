/** McBuleli supports AVEC (village savings & credit associations) only. */
export type GroupSavingsType = "avec";

/** Legacy rows may still read `likelimba` from DB — not creatable via API. */
export type GroupSavingsTypeLegacy = GroupSavingsType | "likelimba";

/** Typical AVEC: 15–25 members (RDC practice). */
export const AVEC_DEFAULT_MIN_MEMBERS = 15;
export const AVEC_DEFAULT_MAX_MEMBERS = 25;
export const AVEC_DEFAULT_SHARE_VALUE_USDT = 10;
export const AVEC_DEFAULT_CYCLE_DAYS = 360;
export const AVEC_DEFAULT_MEETING_DAYS = 7;
export const AVEC_MAX_SHARES_PER_MEETING = 5;

export type GroupSavingsStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "suspended"
  | "closed";

export type GroupSubscriptionStatus = "active" | "overdue" | "suspended";

export type GroupMembershipRole = "admin" | "co_admin" | "committee" | "member";
export type GroupMembershipStatus = "pending" | "approved" | "rejected" | "left";

export const GROUP_SUBSCRIPTION_FEE_USDT = 5;

