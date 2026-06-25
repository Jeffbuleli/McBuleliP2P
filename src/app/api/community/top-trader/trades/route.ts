import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  getTopTraderWeekTrades,
  resolveUserIdByHandle,
} from "@/lib/community/top-trader-competition";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ trades: [] });
  }

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle");
  const userIdParam = url.searchParams.get("userId");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const viewerId = await getSessionUserId();

  let userId = viewerId;
  if (userIdParam) {
    userId = userIdParam;
  } else if (handle) {
    const resolved = await resolveUserIdByHandle(handle);
    if (!resolved) {
      return NextResponse.json({ trades: [] });
    }
    userId = resolved;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trades = await getTopTraderWeekTrades({ userId, limit });
  return NextResponse.json({ trades, userId });
}
