import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { listPostsByHashtag } from "@/lib/community/search-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ tag: string }> },
) {
  if (!communityEnabled()) {
    return NextResponse.json({ hits: [], nextCursor: null });
  }

  const { tag } = await ctx.params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const viewerId = await getSessionUserId();

  const result = await listPostsByHashtag({
    tag: decodeURIComponent(tag),
    viewerId,
    cursor,
    limit,
  });

  return NextResponse.json(result);
}
