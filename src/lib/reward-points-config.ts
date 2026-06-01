/**
 * Buleli Points (BP) — off-chain utility rewards (Phase 1).
 * Public-facing name: "Buleli Points" (not McB ticker until on-chain claim).
 */

export const REWARD_GRANT = {
  EMAIL_VERIFIED: "email_verified",
  KYC_APPROVED: "kyc_approved",
  BOT_FIRST_SUBSCRIPTION: "bot_first_subscription",
} as const;

export type RewardGrantType =
  (typeof REWARD_GRANT)[keyof typeof REWARD_GRANT];

/** Points awarded per one-time grant type. */
export const REWARD_POINTS: Record<RewardGrantType, number> = {
  [REWARD_GRANT.EMAIL_VERIFIED]: 10,
  [REWARD_GRANT.KYC_APPROVED]: 100,
  [REWARD_GRANT.BOT_FIRST_SUBSCRIPTION]: 150,
};

/** Max BP credited per user per calendar month (UTC). */
export const REWARD_MONTHLY_EARN_CAP = 2000;

/** Future on-chain claim ratio (not active in Phase 1). */
export const REWARD_BP_PER_MCB_CLAIM = 100;
