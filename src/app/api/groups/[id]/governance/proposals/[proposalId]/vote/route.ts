import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getDb, groupVotes } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { castGovernanceVote } from "@/lib/avec/governance/vote-engine";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";

const bodyZ = z.object({
  choice: z.enum(["yes", "no", "abstain"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; proposalId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, proposalId } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await castGovernanceVote({
    groupId: id,
    proposalId,
    voterUserId: userId,
    choice: parsed.data.choice,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; proposalId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, proposalId } = await ctx.params;
  const m = await getMyMembershipOrNull({ groupId: id, userId });
  if (!m || m.status !== "approved") {
    return NextResponse.json({ error: "group_forbidden" }, { status: 403 });
  }
  const db = getDb();
  const [row] = await db
    .select({ choice: groupVotes.choice })
    .from(groupVotes)
    .where(and(eq(groupVotes.proposalId, proposalId), eq(groupVotes.voterUserId, userId)))
    .limit(1);
  return NextResponse.json({
    hasVoted: Boolean(row?.choice),
    choice: (row?.choice ?? null) as "yes" | "no" | "abstain" | null,
  });
}
