import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listLoginEvents } from "@/lib/login-events";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await listLoginEvents(userId, 25);
  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
