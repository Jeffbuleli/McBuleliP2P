import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { markSupportThreadRead } from "@/lib/support-service";

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
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const r = await markSupportThreadRead({
    threadId: parsed.data.threadId,
    viewerUserId: userId,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json(r);
}
