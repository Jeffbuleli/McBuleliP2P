import { NextResponse } from "next/server";
import { communityRewardsMeta } from "@/lib/community/rewards-catalog";
import { getSessionUserId } from "@/lib/session";
import { getRewardPointsBalance } from "@/lib/reward-points-service";
import { REWARD_MONTHLY_EARN_CAP } from "@/lib/reward-points-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = communityRewardsMeta();
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({
      ...meta,
      balance: null,
      monthlyCap: REWARD_MONTHLY_EARN_CAP,
    });
  }

  const balance = await getRewardPointsBalance(userId);
  return NextResponse.json({
    ...meta,
    balance,
    monthlyCap: REWARD_MONTHLY_EARN_CAP,
  });
}
