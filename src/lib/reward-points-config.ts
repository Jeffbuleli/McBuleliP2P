/**
 * Buleli Points (BP) — off-chain utility rewards.
 */

export const REWARD_GRANT = {
  EMAIL_VERIFIED: "email_verified",
  KYC_APPROVED: "kyc_approved",
  BOT_FIRST_SUBSCRIPTION: "bot_first_subscription",
  STAKING_OPENED: "staking_opened",
  STAKING_MATURED: "staking_matured",
  P2P_TRADE_COMPLETED: "p2p_trade_completed",
} as const;

export type RewardGrantType =
  (typeof REWARD_GRANT)[keyof typeof REWARD_GRANT];

/** Default points for grant types (overridable per call). */
export const REWARD_POINTS: Record<RewardGrantType, number> = {
  [REWARD_GRANT.EMAIL_VERIFIED]: 10,
  [REWARD_GRANT.KYC_APPROVED]: 100,
  [REWARD_GRANT.BOT_FIRST_SUBSCRIPTION]: 150,
  [REWARD_GRANT.STAKING_OPENED]: 30,
  [REWARD_GRANT.STAKING_MATURED]: 50,
  [REWARD_GRANT.P2P_TRADE_COMPLETED]: 20,
};

/** Max BP credited per user per calendar month (UTC). */
export const REWARD_MONTHLY_EARN_CAP = 2000;

/** Future on-chain claim ratio — active in Phase 3 claim portal. */
export const REWARD_BP_PER_MCB_CLAIM = 100;

export const REWARD_SPEND = {
  P2P_FEE_DISCOUNT_15: {
    perkType: "p2p_fee_discount_15",
    costBp: 80,
    discountPercent: 15,
    validDays: 30,
  },
  BOT_RENEWAL_DISCOUNT_10: {
    perkType: "bot_renewal_discount_10",
    costBp: 200,
    discountPercent: 10,
    validDays: 14,
  },
} as const;

export type RewardSpendId = keyof typeof REWARD_SPEND;

export function rewardSpendOption(id: RewardSpendId) {
  return REWARD_SPEND[id];
}
