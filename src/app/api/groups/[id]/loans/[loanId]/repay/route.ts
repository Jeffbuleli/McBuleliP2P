import { NextResponse } from "next/server";
import { z } from "zod";
import { repayGroupLoan } from "@/lib/avec/group-loans";
import { getSessionUserId } from "@/lib/session";

const bodyZ = z.object({
  amountUsdt: z.number().positive(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; loanId: string }> },
) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, loanId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await repayGroupLoan({
    groupId: id,
    loanId,
    actorUserId,
    amountUsdt: parsed.data.amountUsdt,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
