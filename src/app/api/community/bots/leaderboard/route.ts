import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getBotLeaderboard } from "@/lib/community/bot-leaderboard-service";

export async function GET(req: Request) {
  const viewerId = await getSessionUserId();
  const { searchParams } = new URL(req.url);
  const billing =
    searchParams.get("billing") === "live" ? "live" : "demo";

  const bots = await getBotLeaderboard({
    viewerId,
    billing,
    limit: Number(searchParams.get("limit") ?? "30"),
  });

  return NextResponse.json({ bots, billing });
}
