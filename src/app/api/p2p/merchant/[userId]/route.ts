import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getP2pMerchantProfile } from "@/lib/p2p-merchant-service";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = await ctx.params;
  const profile = await getP2pMerchantProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  return NextResponse.json({ profile });
}
