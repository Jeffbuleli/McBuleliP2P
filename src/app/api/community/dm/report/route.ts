import { NextResponse } from "next/server";
import { z } from "zod";
import { communityReports, getDb } from "@/db";
import { communityEnabled } from "@/lib/community/config";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  threadId: z.string().uuid(),
  reason: z.string().min(2).max(32),
  details: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const db = getDb();
  await db.insert(communityReports).values({
    reporterId: userId,
    targetType: "dm_thread",
    targetId: parsed.data.threadId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  return NextResponse.json({ ok: true });
}
