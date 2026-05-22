import { NextResponse } from "next/server";
import { z } from "zod";
import { rejectGroupLoan } from "@/lib/avec/group-loans";
import { getSessionUserId } from "@/lib/session";

const bodyZ = z.object({
  reason: z.string().min(3).max(500),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; loanId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, loanId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_reject_reason_required" }, { status: 400 });
  }
  const r = await rejectGroupLoan({
    groupId: id,
    loanId,
    actorUserId: userId,
    reason: parsed.data.reason,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
