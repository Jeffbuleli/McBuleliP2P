import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  deleteFeedPost,
  getFeedPostById,
  hideFeedPost,
} from "@/lib/community/feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const patchZ = z.object({
  action: z.enum(["hide", "unhide", "delete"]),
});

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

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (parsed.data.action === "delete") {
    const result = await deleteFeedPost({ postId: id, userId });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  const result = await hideFeedPost({
    postId: id,
    userId,
    hidden: parsed.data.action === "hide",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    status: parsed.data.action === "hide" ? "hidden" : "published",
  });
}
