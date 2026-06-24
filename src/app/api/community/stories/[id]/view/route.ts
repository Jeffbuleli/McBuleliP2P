import { NextResponse } from "next/server";
import { getActiveStoryAuthor } from "@/lib/community/stories-service";
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

  return NextResponse.json({
    ok: true,
    viewerBp: viewerGrant.granted ? viewerGrant.points : 0,
    authorBp: authorGrant.granted ? authorGrant.points : 0,
  });
}
