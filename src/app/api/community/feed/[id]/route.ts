import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { getFeedPostById } from "@/lib/community/feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const viewerId = await getSessionUserId();
  const { id } = await ctx.params;
  const post = await getFeedPostById({ postId: id, viewerId });
  if (!post) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
