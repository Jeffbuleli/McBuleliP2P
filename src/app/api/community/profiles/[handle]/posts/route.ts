import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { listAuthorFeedPosts } from "@/lib/community/feed-service";
import { getPublicProfileByHandle } from "@/lib/community/profile-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ handle: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ posts: [], nextCursor: null });
  }

  const viewerId = await getSessionUserId();
  const { handle } = await ctx.params;
  const profile = await getPublicProfileByHandle(handle, viewerId);
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "15");

  const result = await listAuthorFeedPosts({
    authorId: profile.userId,
    viewerId,
    q,
    cursor,
    limit,
    includeHidden: profile.isOwnProfile,
  });

  return NextResponse.json(result);
}
