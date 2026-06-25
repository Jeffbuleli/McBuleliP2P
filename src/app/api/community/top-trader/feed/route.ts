import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  getTopTraderProgramInfo,
  getTopTraderWeekFeedTrades,
} from "@/lib/community/top-trader-competition";
import { buildDailyLeadersFromFeed } from "@/lib/community/top-trader-ui-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ trades: [], dailyLeaders: [], program: null });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "40");
  const fr = url.searchParams.get("locale") !== "en";

  const [trades, program] = await Promise.all([
    getTopTraderWeekFeedTrades({ limit }),
    Promise.resolve(getTopTraderProgramInfo()),
  ]);

  const dailyLeaders = buildDailyLeadersFromFeed(trades, program, fr);

  return NextResponse.json({ trades, dailyLeaders, program });
}
