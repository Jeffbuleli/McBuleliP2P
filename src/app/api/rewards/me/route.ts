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
