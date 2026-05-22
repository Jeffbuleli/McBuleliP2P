import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { toggleGroupMessageReaction } from "@/lib/group-savings-messaging";

const bodyZ = z.object({
  emoji: z.enum(["👍", "❤️", "😂", "🎉", "👏"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; messageId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, messageId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await toggleGroupMessageReaction({
    groupId: id,
    userId,
    messageId,
    emoji: parsed.data.emoji,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
