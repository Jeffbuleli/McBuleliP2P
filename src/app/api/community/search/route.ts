import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { searchCommunityPosts } from "@/lib/community/search-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ hits: [] });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const viewerId = await getSessionUserId();

  const hits = await searchCommunityPosts({ q, viewerId, limit });
  return NextResponse.json({ hits });
}
