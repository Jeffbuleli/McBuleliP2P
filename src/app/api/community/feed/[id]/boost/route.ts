import { NextResponse } from "next/server";
import { boostCommunityPost } from "@/lib/community/boost-service";
import { communityEnabled } from "@/lib/community/config";
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
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const result = await boostCommunityPost({ userId, postId: id });
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    boostedUntil: result.boostedUntil,
    balance: result.balance,
    costBp: result.costBp,
  });
}
