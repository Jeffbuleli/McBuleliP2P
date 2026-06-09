import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { recordPostView } from "@/lib/community/feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Compte une lecture unique quand un membre connecté ouvre la page détail. */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await recordPostView({ postId: id, viewerId });
  return NextResponse.json(result);
}
