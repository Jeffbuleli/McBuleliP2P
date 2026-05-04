import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listFuturesHistory } from "@/lib/trade-futures-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "live" ? "live" : "demo";
  const limitRaw = Number(searchParams.get("limit") ?? "30");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 30;
  const data = await listFuturesHistory(userId, mode, limit);
  return NextResponse.json(data);
}

