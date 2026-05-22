import { NextResponse } from "next/server";
import { acceptMemberLoanRequest } from "@/lib/avec/group-loans";
import { getSessionUserId } from "@/lib/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; loanId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, loanId } = await ctx.params;
  const r = await acceptMemberLoanRequest({
    groupId: id,
    loanId,
    actorUserId: userId,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
