import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { updateGroupProfile } from "@/lib/group-savings-profile";

const bodyZ = z.object({
  name: z.string().min(2).max(96).optional(),
  logoUrl: z.string().max(600_000).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  contactPhone: z.string().max(32).nullable().optional(),
  contactEmail: z.string().max(128).nullable().optional(),
  publicDescription: z.string().max(2000).nullable().optional(),
});

export async function PATCH(
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
  const r = await updateGroupProfile({
    groupId: id,
    actorUserId: userId,
    ...parsed.data,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
