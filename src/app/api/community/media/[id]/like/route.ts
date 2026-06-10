import { NextResponse } from "next/server";
import { toggleMediaLike } from "@/lib/community/media-engagement-service";
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

  const { id } = await ctx.params;
  const result = await toggleMediaLike({ userId, mediaId: id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    liked: result.liked,
    likeCount: result.likeCount,
  });
}
