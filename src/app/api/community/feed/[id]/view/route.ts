import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { incrementPostView } from "@/lib/community/feed-service";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const { id } = await ctx.params;
  const viewCount = await incrementPostView(id);
  return NextResponse.json({ viewCount });
}
