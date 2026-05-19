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
  const limitRaw = Number(searchParams.get("limit") ?? "10");
  const limit = ([10, 20, 30] as const).includes(limitRaw as 10 | 20 | 30)
    ? (limitRaw as 10 | 20 | 30)
    : 10;
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
  const data = await listFuturesHistory(userId, mode, { limit, offset });
  return NextResponse.json(data);
}
