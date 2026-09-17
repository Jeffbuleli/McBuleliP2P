import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getEavecMarketOrder } from "@/lib/eavec-market/orders";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const order = await getEavecMarketOrder(id, userId);
  if (!order) {
    return NextResponse.json({ error: "eavec_market_order_not_found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
