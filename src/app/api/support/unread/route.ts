import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { countSupportUnread } from "@/lib/support-service";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const unreadCount = await countSupportUnread(userId);
  return NextResponse.json({ unreadCount });
}
