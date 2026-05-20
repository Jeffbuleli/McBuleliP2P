import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getOrCreateSupportThread } from "@/lib/support-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const thread = await getOrCreateSupportThread(userId);
  if (!thread) {
    return NextResponse.json({ error: "support_unavailable" }, { status: 503 });
  }
  return NextResponse.json({ thread });
}
