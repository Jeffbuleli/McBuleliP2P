import { NextResponse } from "next/server";
import { getPostMediaItem } from "@/lib/community/media-engagement-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const viewerId = await getSessionUserId();
  const { id: mediaId } = await ctx.params;
  const url = new URL(req.url);
  const postId = url.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "post_id_required" }, { status: 400 });
  }

  const result = await getPostMediaItem({ postId, mediaId, viewerId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    media: result.media,
    postBody: result.postBody,
    author: result.author,
    publishedAt: result.publishedAt,
    postIndex: result.postIndex,
    postMediaCount: result.postMediaCount,
    postId,
  });
}
