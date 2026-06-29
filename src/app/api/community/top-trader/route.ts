import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  getTopTraderLeaderboard,
  listTopTraderProgramWeeks,
} from "@/lib/community/top-trader-competition";
import {
  getLastTopTraderWinner,
  listTopTraderWeekHistory,
} from "@/lib/community/top-trader-payout-service";
import { getTopTraderParticipantStatus } from "@/lib/community/top-trader-participant-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ program: null, traders: [] });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const weekStartAt = url.searchParams.get("weekStartAt");
  const historyLimit = Number(url.searchParams.get("historyLimit") ?? "12");
  const viewerId = await getSessionUserId();

  const [data, participant, lastWinner, weekHistory, availableWeeks] =
    await Promise.all([
      getTopTraderLeaderboard({ viewerId, limit, weekStartAt }),
      viewerId ? getTopTraderParticipantStatus(viewerId) : null,
      getLastTopTraderWinner(),
      listTopTraderWeekHistory(historyLimit),
      Promise.resolve(listTopTraderProgramWeeks()),
    ]);

  return NextResponse.json({
    ...data,
    participant,
    lastWinner,
    weekHistory,
    availableWeeks,
  });
}
