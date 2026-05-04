import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listActiveStakes, processMaturedStakesForUser } from "@/lib/staking-service";
import {
  stakingMinPrincipal,
  stakingTermsFor,
  type StakingChainAsset,
} from "@/lib/staking-config";

const ASSETS: StakingChainAsset[] = ["USDT", "PI"];

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await processMaturedStakesForUser(userId);
  const stakes = await listActiveStakes(userId);
  const catalog = Object.fromEntries(
    ASSETS.map((a) => [
      a,
      {
        minPrincipal: stakingMinPrincipal(a),
        terms: stakingTermsFor(a),
      },
    ]),
  ) as Record<
    StakingChainAsset,
    { minPrincipal: number; terms: { days: number; aprPercent: number }[] }
  >;

  return NextResponse.json({ catalog, stakes });
}
