import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { getTraderLeaderboard } from "@/lib/community/leaderboard-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ traders: [] });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "30");
  const viewerId = await getSessionUserId();

  const traders = await getTraderLeaderboard({ viewerId, limit });
  return NextResponse.json({ traders });
}
