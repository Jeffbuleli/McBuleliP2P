import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import { optInTopTrader } from "@/lib/community/top-trader-participant-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await optInTopTrader(userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
