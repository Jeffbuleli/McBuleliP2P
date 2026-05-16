import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { buildMockBotActivityFeed } from "@/lib/bot-activity-mock";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = buildMockBotActivityFeed();
  return NextResponse.json({
    ...feed,
    simulated: true,
    polledAt: new Date().toISOString(),
  });
}
