import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { reviewMember } from "@/lib/group-savings-service";

const bodyZ = z.object({ accept: z.boolean() });

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await reviewMember({
    groupId: id,
    actorUserId,
    targetUserId: userId,
    accept: parsed.data.accept,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

