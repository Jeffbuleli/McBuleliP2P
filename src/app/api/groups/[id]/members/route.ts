import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { requestJoinGroup } from "@/lib/group-savings-service";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await requestJoinGroup({ groupId: id, userId });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

