import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getOrderDetailForUser } from "@/lib/p2p-service";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await getOrderDetailForUser({ orderId: id, userId });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json(r.order);
}
