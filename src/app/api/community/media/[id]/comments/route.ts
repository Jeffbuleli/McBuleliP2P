import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addMediaComment,
  listMediaComments,
} from "@/lib/community/media-engagement-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const postZ = z.object({
  postId: z.string().uuid(),
  body: z.string().min(2).max(1200),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const viewerId = await getSessionUserId();
  const { id } = await ctx.params;
  const comments = await listMediaComments(id, viewerId);
  return NextResponse.json({ comments });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: mediaId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await addMediaComment({
    userId,
    mediaId,
    postId: parsed.data.postId,
    body: parsed.data.body,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ comment: result.comment });
}
