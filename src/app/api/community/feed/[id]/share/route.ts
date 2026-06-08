import { NextResponse } from "next/server";
import { recordPostShare } from "@/lib/community/feed-service";
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
  const result = await recordPostShare({ userId, postId: id });
  return NextResponse.json(result);
}
