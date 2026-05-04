import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { openFuturesPosition } from "@/lib/trade-futures-service";

const bodyZ = z.object({
  mode: z.enum(["demo", "live"]),
  symbol: z.string().min(4),
  side: z.enum(["long", "short"]),
  leverage: z.union([z.literal(2), z.literal(5), z.literal(10)]),
  marginUsdt: z.number().positive(),
  stopLossPrice: z.number().positive().optional().nullable(),
  takeProfitPrice: z.number().positive().optional().nullable(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "trade_invalid_body" }, { status: 400 });
  }
  const r = await openFuturesPosition({
    userId,
    mode: parsed.data.mode,
    symbol: parsed.data.symbol,
    side: parsed.data.side,
    leverage: parsed.data.leverage,
    marginUsdt: parsed.data.marginUsdt,
    stopLossPrice: parsed.data.stopLossPrice,
    takeProfitPrice: parsed.data.takeProfitPrice,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, positionId: r.positionId });
}
