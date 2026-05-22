import { NextResponse } from "next/server";
import { approveCycleClosure } from "@/lib/avec/group-cycle-closure";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; requestId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, requestId } = await ctx.params;
  try {
    const r = await approveCycleClosure({
      groupId: id,
      requestId,
      actorUserId: userId,
    });
    if (!r.ok) {
      const status =
        r.message === "group_forbidden"
          ? 403
          : r.message === "group_closure_not_found"
            ? 404
            : 400;
      return NextResponse.json({ error: r.message }, { status });
    }
    return NextResponse.json(r);
  } catch (err) {
    console.error("[POST /api/groups/:id/closure/:requestId/approve]", err);
    return NextResponse.json({ error: "group_action_failed" }, { status: 500 });
  }
}
