import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { touchCommunityPresence } from "@/lib/community/dm-service";
import { getPublicProfileByHandle } from "@/lib/community/profile-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const viewerId = await getSessionUserId();
  if (viewerId) void touchCommunityPresence(viewerId);

  const { handle } = await ctx.params;
  const profile = await getPublicProfileByHandle(handle, viewerId);
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
