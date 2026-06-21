import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { payForEvent } from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const out = await payForEvent({ idOrSlug: id, userId });
  if (!out.ok) {
    const status = out.code === "event_insufficient_balance" ? 402 : 400;
    return NextResponse.json({ error: out.code }, { status });
  }
  return NextResponse.json({ ok: true });
}
