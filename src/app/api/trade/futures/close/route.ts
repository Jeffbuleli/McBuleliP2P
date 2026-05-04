import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { closeFuturesPosition } from "@/lib/trade-futures-service";

const bodyZ = z.object({
  positionId: z.string().uuid(),
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
  const r = await closeFuturesPosition({
    userId,
    positionId: parsed.data.positionId,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
