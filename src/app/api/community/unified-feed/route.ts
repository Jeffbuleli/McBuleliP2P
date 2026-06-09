import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  listUnifiedFeed,
  type CommunityFeedCategory,
} from "@/lib/community/unified-feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const CATEGORIES: CommunityFeedCategory[] = [
  "all",
  "news",
  "discussions",
  "training",
  "blogs",
  "questions",
  "signals",
];

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ items: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("category") ?? "all";
  const category = CATEGORIES.includes(raw as CommunityFeedCategory)
    ? (raw as CommunityFeedCategory)
    : "all";
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const viewerId = await getSessionUserId();

  if (category === "training") {
    return NextResponse.json({ items: [], nextCursor: null, redirect: "/app/community/formations" });
  }

  const result = await listUnifiedFeed({
    viewerId,
    category,
    cursor,
    limit,
  });

  return NextResponse.json(result);
}
