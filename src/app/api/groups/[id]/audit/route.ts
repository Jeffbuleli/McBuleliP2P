import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listGroupAuditLog } from "@/lib/group-savings-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "60");
  const limit = Number.isFinite(limitRaw) ? limitRaw : 60;
  const { id } = await ctx.params;
  const r = await listGroupAuditLog({ groupId: id, userId, limit });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 403 });
  return NextResponse.json(r);
}

