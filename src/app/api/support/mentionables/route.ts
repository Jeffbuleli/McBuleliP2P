import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  getOrCreateSupportThread,
  listSupportMentionables,
} from "@/lib/support-service";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  let threadId = url.searchParams.get("threadId") ?? undefined;
  if (!threadId) {
    const th = await getOrCreateSupportThread(userId);
    threadId = th?.id;
  }
  const participants = await listSupportMentionables({
    viewerUserId: userId,
    threadId,
  });
  return NextResponse.json({ participants });
}
