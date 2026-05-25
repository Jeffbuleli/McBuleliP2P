import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  listPendingGroupPayouts,
} from "@/lib/group-savings-payouts";
import { proposeGroupPayoutWithGovernance } from "@/lib/avec/governance/payout-bridge";

const bodyZ = z.object({
  toUserId: z.string().uuid(),
  amountUsdt: z.number().positive(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await listPendingGroupPayouts({ groupId: id, userId });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 403 });
  return NextResponse.json(r);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const actorUserId = await getSessionUserId();
  if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await proposeGroupPayoutWithGovernance({
    groupId: id,
    actorUserId,
    toUserId: parsed.data.toUserId,
    amountUsdt: parsed.data.amountUsdt,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
