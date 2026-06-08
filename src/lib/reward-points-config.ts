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
  TRAINING_ENROLLED: "training_enrolled",
  TRAINING_SESSION_ATTENDED: "training_session_attended",
  TRAINING_QUIZ_PASSED: "training_quiz_passed",
  /** Community Hub — convertibles en McB (Phase 3 claim). */
  COMMUNITY_PROFILE_SETUP: "community_profile_setup",
  COMMUNITY_FIRST_POST: "community_first_post",
  COMMUNITY_POST_TEXT: "community_post_text",
  COMMUNITY_POST_IMAGE: "community_post_image",
  COMMUNITY_POST_VIDEO: "community_post_video",
  COMMUNITY_COMMENT: "community_comment",
  COMMUNITY_LIKE: "community_like",
  COMMUNITY_LIKE_RECEIVED: "community_like_received",
  COMMUNITY_SHARE: "community_share",
  COMMUNITY_BLOG_PUBLISH: "community_blog_publish",
  COMMUNITY_QUESTION: "community_question",
  COMMUNITY_ANSWER: "community_answer",
  COMMUNITY_ANSWER_ACCEPTED: "community_answer_accepted",
  COMMUNITY_ANSWER_UPVOTE: "community_answer_upvote",
  COMMUNITY_LIVE_JOIN: "community_live_join",
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
  [REWARD_GRANT.TRAINING_ENROLLED]: 25,
  [REWARD_GRANT.TRAINING_SESSION_ATTENDED]: 40,
  [REWARD_GRANT.TRAINING_QUIZ_PASSED]: 60,
  [REWARD_GRANT.COMMUNITY_PROFILE_SETUP]: 20,
  [REWARD_GRANT.COMMUNITY_FIRST_POST]: 50,
  [REWARD_GRANT.COMMUNITY_POST_TEXT]: 25,
  [REWARD_GRANT.COMMUNITY_POST_IMAGE]: 40,
  [REWARD_GRANT.COMMUNITY_POST_VIDEO]: 60,
  [REWARD_GRANT.COMMUNITY_COMMENT]: 8,
  [REWARD_GRANT.COMMUNITY_LIKE]: 3,
  [REWARD_GRANT.COMMUNITY_LIKE_RECEIVED]: 5,
  [REWARD_GRANT.COMMUNITY_SHARE]: 12,
  [REWARD_GRANT.COMMUNITY_BLOG_PUBLISH]: 100,
  [REWARD_GRANT.COMMUNITY_QUESTION]: 20,
  [REWARD_GRANT.COMMUNITY_ANSWER]: 25,
  [REWARD_GRANT.COMMUNITY_ANSWER_ACCEPTED]: 50,
  [REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE]: 5,
  [REWARD_GRANT.COMMUNITY_LIVE_JOIN]: 35,
};

/** Max BP credited per user per calendar month (UTC). */
export const REWARD_MONTHLY_EARN_CAP = 4000;

/** Plafonds journaliers par type (anti-spam communauté). */
export const COMMUNITY_REWARD_DAILY_CAPS: Partial<
  Record<RewardGrantType, number>
> = {
  [REWARD_GRANT.COMMUNITY_POST_TEXT]: 8,
  [REWARD_GRANT.COMMUNITY_POST_IMAGE]: 8,
  [REWARD_GRANT.COMMUNITY_POST_VIDEO]: 5,
  [REWARD_GRANT.COMMUNITY_COMMENT]: 30,
  [REWARD_GRANT.COMMUNITY_LIKE]: 50,
  [REWARD_GRANT.COMMUNITY_LIKE_RECEIVED]: 100,
  [REWARD_GRANT.COMMUNITY_SHARE]: 15,
  [REWARD_GRANT.COMMUNITY_BLOG_PUBLISH]: 3,
  [REWARD_GRANT.COMMUNITY_QUESTION]: 8,
  [REWARD_GRANT.COMMUNITY_ANSWER]: 20,
  [REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE]: 40,
  [REWARD_GRANT.COMMUNITY_LIVE_JOIN]: 5,
};

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
