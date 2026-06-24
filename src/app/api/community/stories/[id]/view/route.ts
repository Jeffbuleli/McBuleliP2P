import { NextResponse } from "next/server";
import { getActiveStoryAuthor, recordStoryView } from "@/lib/community/stories-service";
import {
  grantCommunityStoryViewReceived,
  grantCommunityStoryViewed,
} from "@/lib/community/rewards-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await ctx.params;
  const story = await getActiveStoryAuthor(storyId);
  if (!story) {
    return NextResponse.json({ error: "story_not_found" }, { status: 404 });
  }

  const viewerGrant = await grantCommunityStoryViewed({
    viewerId: userId,
    storyId,
    authorId: story.authorId,
  });
  const authorGrant = await grantCommunityStoryViewReceived({
    authorId: story.authorId,
    storyId,
    viewerId: userId,
  });

  const viewCount = await recordStoryView(storyId, userId);

  return NextResponse.json({
    ok: true,
    viewCount,
    viewerBp: viewerGrant.granted ? viewerGrant.points : 0,
    authorBp: authorGrant.granted ? authorGrant.points : 0,
  });
}
