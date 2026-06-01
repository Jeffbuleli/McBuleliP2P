import { NextResponse } from "next/server";
import { z } from "zod";
import { REWARD_SPEND, type RewardSpendId } from "@/lib/reward-points-config";
import { spendRewardPointsForPerk } from "@/lib/reward-points-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  spendId: z.enum(
    Object.keys(REWARD_SPEND) as [RewardSpendId, ...RewardSpendId[]],
  ),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const result = await spendRewardPointsForPerk({
    userId,
    spendId: parsed.data.spendId,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    balance: result.balance,
    perkType: result.perkType,
  });
}
