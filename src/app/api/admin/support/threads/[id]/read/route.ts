import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { markSupportThreadRead } from "@/lib/support-service";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const u = await getSessionUser();
  if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const r = await markSupportThreadRead({ threadId: id, viewerUserId: u.id });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json(r);
}
