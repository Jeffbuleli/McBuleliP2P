import { NextResponse } from "next/server";
import { getEavecMerchantProfile } from "@/lib/eavec-market/merchant";
import { listEavecMarketListings } from "@/lib/eavec-market/service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  const { userId } = await ctx.params;
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const profile = await getEavecMerchantProfile(userId);
  if (!profile) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { listings } = await listEavecMarketListings({
    mineUserId: userId,
    limit: 24,
  });
  const available = listings.filter((l) => l.status === "available");
  return NextResponse.json({ profile, listings: available });
}
