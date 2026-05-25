import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  createMemberProposal,
  listGroupProposals,
} from "@/lib/avec/governance/proposal-engine";

const createZ = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("revoke_admin"),
    title: z.string().max(200).optional(),
    justification: z.string().min(10).max(2000),
    payload: z.object({ targetUserId: z.string().uuid() }),
  }),
  z.object({
    type: z.literal("change_interest_rate"),
    title: z.string().max(200).optional(),
    justification: z.string().min(10).max(2000),
    payload: z.object({ interestRatePctTotal: z.number().min(1).max(30) }),
  }),
  z.object({
    type: z.literal("set_co_admins"),
    title: z.string().max(200).optional(),
    justification: z.string().min(10).max(2000),
    payload: z.object({
      coAdminUserIds: z.array(z.string().uuid()).max(3),
    }),
  }),
  z.object({
    type: z.literal("set_committee"),
    title: z.string().max(200).optional(),
    justification: z.string().min(10).max(2000),
    payload: z.object({
      committeeUserIds: z.array(z.string().uuid()).max(7),
    }),
  }),
  z.object({
    type: z.literal("change_social_fund"),
    title: z.string().max(200).optional(),
    justification: z.string().min(10).max(2000),
    payload: z.object({ socialFundUsdt: z.number().min(0) }),
  }),
]);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await listGroupProposals({ groupId: id, userId });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 403 });
  return NextResponse.json(r);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await createMemberProposal({
    groupId: id,
    authorUserId: userId,
    type: parsed.data.type,
    title: parsed.data.title,
    justification: parsed.data.justification,
    payload: parsed.data.payload,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
