import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { publishGroupMinutes } from "@/lib/group-savings-messaging";

const bodyZ = z.object({
  body: z.string().max(4000),
  meetingLabel: z.string().max(120).optional().nullable(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await publishGroupMinutes({
    groupId: id,
    userId,
    body: parsed.data.body,
    meetingLabel: parsed.data.meetingLabel,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true, messageId: r.messageId });
}
