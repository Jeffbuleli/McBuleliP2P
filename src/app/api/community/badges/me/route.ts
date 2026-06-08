import { NextResponse } from "next/server";
import { listUserBadges } from "@/lib/community/badges-service";
import { communityEnabled } from "@/lib/community/config";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ badges: [] });
  }

  const badges = await listUserBadges(userId);
  return NextResponse.json({ badges });
}
