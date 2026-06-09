import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import { createFeedPost, listFeedPosts } from "@/lib/community/feed-service";
import { assertOwnedMedia } from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const createZ = z.object({
  body: z.string().min(20).max(4000),
  postType: z.enum(["text", "image", "video"]).optional(),
  mediaIds: z.array(z.string().uuid()).max(4).optional(),
});

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ posts: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const sort = url.searchParams.get("sort") as
    | "recent"
    | "popular"
    | "trending"
    | "following"
    | null;
  const viewerId = await getSessionUserId();

  const result = await listFeedPosts({
    viewerId,
    cursor,
    limit,
    sort: sort ?? "recent",
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const mediaIds = parsed.data.mediaIds ?? [];
  if (mediaIds.length) {
    const ok = await assertOwnedMedia(userId, mediaIds);
    if (!ok) {
      return NextResponse.json({ error: "invalid_media" }, { status: 400 });
    }
  }

  const result = await createFeedPost({
    authorId: userId,
    body: parsed.data.body,
    postType: parsed.data.postType,
    mediaIds,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    post: result.post,
    bpGranted: result.bpGranted,
  });
}
