import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getGroupDashboard } from "@/lib/group-savings-service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const r = await getGroupDashboard({ groupId: id, userId });
    if (!r.ok) {
      const status = r.message === "group_forbidden" ? 403 : 404;
      return NextResponse.json({ error: r.message }, { status });
    }
    return NextResponse.json(r);
  } catch (err) {
    console.error("[GET /api/groups/:id]", err);
    return NextResponse.json({ error: "group_dashboard_failed" }, { status: 500 });
  }
}

