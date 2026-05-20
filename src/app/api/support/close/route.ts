import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  closeSupportThreadByUser,
  ensureOpenSupportThread,
} from "@/lib/support-service";

const bodyZ = z.object({
  threadId: z.string().uuid(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "support_thread_not_found" }, { status: 400 });
  }
  const closed = await closeSupportThreadByUser({
    threadId: parsed.data.threadId,
    userId,
    reason: "satisfied",
  });
  if (!closed.ok) {
    return NextResponse.json({ error: closed.message }, { status: 400 });
  }
  const thread = await ensureOpenSupportThread(userId);
  if (!thread) {
    return NextResponse.json({ error: "support_unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, thread });
}
