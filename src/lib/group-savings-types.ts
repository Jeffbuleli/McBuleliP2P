export type GroupSavingsType = "likelimba" | "avec";

export type GroupSavingsStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "suspended"
  | "closed";

export type GroupSubscriptionStatus = "active" | "overdue" | "suspended";

export type GroupMembershipRole = "admin" | "co_admin" | "member";
export type GroupMembershipStatus = "pending" | "approved" | "rejected" | "left";

export const GROUP_SUBSCRIPTION_FEE_USDT = 5;

