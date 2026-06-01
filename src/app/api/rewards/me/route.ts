import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  REWARD_GRANT,
  REWARD_POINTS,
} from "@/lib/reward-points-config";
import {
  getRewardPointsSummary,
  listRewardPointLedger,
} from "@/lib/reward-points-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [summary, ledger] = await Promise.all([
    getRewardPointsSummary(userId),
    listRewardPointLedger(userId, 40),
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
    },
    grants: summary.grants,
    ledger,
  });
}
