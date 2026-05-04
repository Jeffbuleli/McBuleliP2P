import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listGroupLedger } from "@/lib/group-savings-service";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "50");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
  const { id } = await ctx.params;
  const r = await listGroupLedger({ groupId: id, userId, limit });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 403 });
  return NextResponse.json(r);
}

