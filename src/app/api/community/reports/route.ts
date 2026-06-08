import { NextResponse } from "next/server";
import { z } from "zod";
import { reportCommunityContent } from "@/lib/community/feed-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const postZ = z.object({
  targetType: z.enum(["post", "comment", "blog", "question", "answer"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "abuse", "scam", "off_topic", "other"]),
  details: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await reportCommunityContent({
    reporterId: userId,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details,
  });

  return NextResponse.json({ ok: true });
}
