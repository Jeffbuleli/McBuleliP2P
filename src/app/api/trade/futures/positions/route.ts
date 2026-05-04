import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { z } from "zod";
import {
  listFuturesPositions,
  updateFuturesSlTp,
} from "@/lib/trade-futures-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "live" ? "live" : "demo";
  const data = await listFuturesPositions(userId, mode);
  return NextResponse.json(data);
}

const patchZ = z.object({
  positionId: z.string().uuid(),
  stopLossPrice: z.number().nullable().optional(),
  takeProfitPrice: z.number().nullable().optional(),
});

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = patchZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "trade_invalid_body" }, { status: 400 });
  }
  const r = await updateFuturesSlTp({
    userId,
    positionId: parsed.data.positionId,
    stopLossPrice: parsed.data.stopLossPrice,
    takeProfitPrice: parsed.data.takeProfitPrice,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json(r);
}
