import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  listCycleClosureState,
  previewCycleClosure,
  proposeCycleClosure,
} from "@/lib/avec/group-cycle-closure";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const state = await listCycleClosureState({ groupId: id, userId });
    return NextResponse.json(state);
  } catch (err) {
    console.error("[GET /api/groups/:id/closure]", err);
    return NextResponse.json({ error: "group_action_failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const previewOnly = Boolean((body as { preview?: boolean }).preview);

  try {
    if (previewOnly) {
      const r = await previewCycleClosure({ groupId: id, userId });
      if (!r.ok) {
        const status = r.message === "group_forbidden" ? 403 : 400;
        return NextResponse.json({ error: r.message }, { status });
      }
      return NextResponse.json(r);
    }

    const r = await proposeCycleClosure({ groupId: id, actorUserId: userId });
    if (!r.ok) {
      const status =
        r.message === "group_forbidden"
          ? 403
          : r.message === "group_not_found"
            ? 404
            : 400;
      return NextResponse.json({ error: r.message }, { status });
    }
    return NextResponse.json(r);
  } catch (err) {
    console.error("[POST /api/groups/:id/closure]", err);
    return NextResponse.json({ error: "group_action_failed" }, { status: 500 });
  }
}
