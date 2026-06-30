import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { getTopTraderLeaderboard } from "@/lib/community/top-trader-competition";
import { getLastTopTraderWinner } from "@/lib/community/top-trader-payout-service";
import { getTopTraderParticipantStatus } from "@/lib/community/top-trader-participant-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ program: null, traders: [] });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const viewerId = await getSessionUserId();

  const data = await getTopTraderLeaderboard({ viewerId, limit });
  const participant = viewerId
    ? await getTopTraderParticipantStatus(viewerId)
    : null;
  const lastWinner = await getLastTopTraderWinner();
  return NextResponse.json({ ...data, participant, lastWinner });
}
