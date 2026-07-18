import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { suggestCommunitySearch } from "@/lib/community/search-suggest-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ q: "", items: [], ai: false });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const fr = (url.searchParams.get("locale") ?? "en").startsWith("fr");
  const viewerId = await getSessionUserId();

  const result = await suggestCommunitySearch({
    q,
    viewerId,
    fr,
    limit: Number.isFinite(limit) ? limit : 12,
  });

  return NextResponse.json(result);
}
