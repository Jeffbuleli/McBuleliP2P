import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getAdForTaker } from "@/lib/p2p-service";

/** Active ad detail for starting a trade (taker must not be ad owner). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await getAdForTaker({ adId: id, takerId: userId });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ad: r.ad });
}
