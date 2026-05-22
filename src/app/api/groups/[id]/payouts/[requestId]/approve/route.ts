import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { approveGroupPayout } from "@/lib/group-savings-payouts";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; requestId: string }> },
) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, requestId } = await ctx.params;
  const r = await approveGroupPayout({
    groupId: id,
    requestId,
    actorUserId,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
