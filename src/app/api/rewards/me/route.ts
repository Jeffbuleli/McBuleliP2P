import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  REWARD_GRANT,
  REWARD_POINTS,
  REWARD_SPEND,
} from "@/lib/reward-points-config";
import {
  getRewardPointsSummary,
  listActiveRewardPerks,
  listRewardPointLedger,
  reconcileUserRewardPoints,
} from "@/lib/reward-points-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await reconcileUserRewardPoints(userId);

  const [summary, ledger, activePerks] = await Promise.all([
    getRewardPointsSummary(userId),
    listRewardPointLedger(userId, 40),
    listActiveRewardPerks(userId),
  ]);

  return NextResponse.json({
    balance: summary.balance,
    monthlyEarned: summary.monthlyEarned,
    monthlyCap: summary.monthlyCap,
    earnRates: {
      [REWARD_GRANT.EMAIL_VERIFIED]: REWARD_POINTS[REWARD_GRANT.EMAIL_VERIFIED],
      [REWARD_GRANT.KYC_APPROVED]: REWARD_POINTS[REWARD_GRANT.KYC_APPROVED],
      [REWARD_GRANT.BOT_FIRST_SUBSCRIPTION]:
        REWARD_POINTS[REWARD_GRANT.BOT_FIRST_SUBSCRIPTION],
      [REWARD_GRANT.STAKING_OPENED]: REWARD_POINTS[REWARD_GRANT.STAKING_OPENED],
      [REWARD_GRANT.STAKING_MATURED]: REWARD_POINTS[REWARD_GRANT.STAKING_MATURED],
      [REWARD_GRANT.P2P_TRADE_COMPLETED]:
        REWARD_POINTS[REWARD_GRANT.P2P_TRADE_COMPLETED],
      [REWARD_GRANT.TRAINING_ENROLLED]:
        REWARD_POINTS[REWARD_GRANT.TRAINING_ENROLLED],
      [REWARD_GRANT.TRAINING_SESSION_ATTENDED]:
        REWARD_POINTS[REWARD_GRANT.TRAINING_SESSION_ATTENDED],
      [REWARD_GRANT.TRAINING_QUIZ_PASSED]:
        REWARD_POINTS[REWARD_GRANT.TRAINING_QUIZ_PASSED],
      [REWARD_GRANT.COMMUNITY_PROFILE_SETUP]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_PROFILE_SETUP],
      [REWARD_GRANT.COMMUNITY_FIRST_POST]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_FIRST_POST],
      [REWARD_GRANT.COMMUNITY_POST_TEXT]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_TEXT],
      [REWARD_GRANT.COMMUNITY_POST_IMAGE]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_IMAGE],
      [REWARD_GRANT.COMMUNITY_POST_VIDEO]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_VIDEO],
      [REWARD_GRANT.COMMUNITY_COMMENT]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_COMMENT],
      [REWARD_GRANT.COMMUNITY_LIKE]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIKE],
      [REWARD_GRANT.COMMUNITY_BLOG_PUBLISH]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_BLOG_PUBLISH],
      [REWARD_GRANT.COMMUNITY_QUESTION]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_QUESTION],
      [REWARD_GRANT.COMMUNITY_ANSWER]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_ANSWER],
      [REWARD_GRANT.COMMUNITY_LIVE_JOIN]:
        REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIVE_JOIN],
    },
    spendOptions: Object.entries(REWARD_SPEND).map(([id, opt]) => ({
      id,
      perkType: opt.perkType,
      costBp: opt.costBp,
      discountPercent: opt.discountPercent,
      validDays: opt.validDays,
    })),
    activePerks,
    grants: summary.grants,
    ledger,
  });
}
