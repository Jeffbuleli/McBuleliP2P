import { NextResponse } from "next/server";
import { boostP2pAd } from "@/lib/p2p-service";
import { getSessionUserId } from "@/lib/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const r = await boostP2pAd({ userId, adId: id });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, boostedUntil: r.boostedUntil });
}
