import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listEavecMarketListings } from "@/lib/eavec-market/service";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "24");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const result = await listEavecMarketListings({
    mineUserId: userId,
    limit: Number.isFinite(limit) ? limit : 24,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return NextResponse.json(result);
}
