import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  getEavecMarketListing,
  updateEavecMarketListingStatus,
} from "@/lib/eavec-market/service";
import type { EavecMarketListingStatus } from "@/lib/eavec-market/categories";

const patchZ = z.object({
  status: z.enum(["available", "paused", "sold", "closed"]),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const listing = await getEavecMarketListing(id);
  if (!listing) {
    return NextResponse.json({ error: "eavec_market_not_found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "eavec_market_invalid" }, { status: 400 });
  }
  const r = await updateEavecMarketListingStatus({
    id,
    sellerUserId: userId,
    status: parsed.data.status as EavecMarketListingStatus,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
