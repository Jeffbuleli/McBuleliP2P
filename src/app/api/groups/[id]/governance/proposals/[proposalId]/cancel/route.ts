import { NextResponse } from "next/server";
import { cancelGovernanceProposal } from "@/lib/avec/governance/proposal-engine";
import { getSessionUserId } from "@/lib/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string; proposalId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, proposalId } = await ctx.params;
  const r = await cancelGovernanceProposal({
    groupId: id,
    proposalId,
    actorUserId: userId,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
