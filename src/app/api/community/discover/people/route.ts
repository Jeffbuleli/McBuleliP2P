import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { suggestPeopleToFollow } from "@/lib/community/follows-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const viewerId = await getSessionUserId();
  if (!viewerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const excludeRaw = url.searchParams.get("exclude") ?? "";
  const excludeUserIds = excludeRaw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s))
    .slice(0, 80);

  const people = await suggestPeopleToFollow({
    viewerId,
    limit: Number.isFinite(limit) ? limit : 12,
    excludeUserIds,
  });

  return NextResponse.json({ people });
}
