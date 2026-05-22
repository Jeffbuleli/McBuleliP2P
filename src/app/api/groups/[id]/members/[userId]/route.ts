import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  reviewMember,
  revokeMember,
  setMemberRole,
} from "@/lib/group-savings-service";

const bodyZ = z.discriminatedUnion("action", [
  z.object({ action: z.literal("review"), accept: z.boolean() }),
  z.object({ action: z.literal("revoke") }),
  z.object({
    action: z.literal("role"),
    role: z.enum(["member", "co_admin"]),
  }),
]);

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, userId: targetUserId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }

  if (parsed.data.action === "review") {
    const r = await reviewMember({
      groupId: id,
      actorUserId,
      targetUserId,
      accept: parsed.data.accept,
    });
    if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "revoke") {
    const r = await revokeMember({ groupId: id, actorUserId, targetUserId });
    if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const r = await setMemberRole({
    groupId: id,
    actorUserId,
    targetUserId,
    role: parsed.data.role,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
