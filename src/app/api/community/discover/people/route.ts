import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { suggestPeopleToFollow } from "@/lib/community/follows-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "12");

  const people = await suggestPeopleToFollow({
    viewerId,
    limit: Number.isFinite(limit) ? limit : 12,
  });

  return NextResponse.json({ people });
}
