import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listSimpleOptions } from "@/lib/trade-options-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "live" ? "live" : "demo";
  const orders = await listSimpleOptions(userId, mode);
  return NextResponse.json({ orders });
}
