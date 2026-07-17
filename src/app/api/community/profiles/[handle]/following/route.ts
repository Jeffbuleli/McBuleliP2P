import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { listFollowingOf } from "@/lib/community/follows-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { handle } = await ctx.params;
  const viewerId = await getSessionUserId();
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "40");
  const cursor = url.searchParams.get("cursor");

  const result = await listFollowingOf({
    handle,
    viewerId,
    limit: Number.isFinite(limit) ? limit : 40,
    cursor,
  });

  return NextResponse.json(result);
}
