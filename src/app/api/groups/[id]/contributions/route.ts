import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { contributeToGroup } from "@/lib/group-savings-service";

const bodyZ = z
  .object({
    amountUsdt: z.number().positive().optional(),
    shares: z.number().int().min(1).max(5).optional(),
  })
  .refine((b) => b.amountUsdt != null || b.shares != null, {
    message: "group_invalid_amount",
  });

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const kyc = await checkKycGate(userId, "groups");
  if (!kyc.ok) return NextResponse.json({ error: kyc.error }, { status: 403 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await contributeToGroup({
    groupId: id,
    userId,
    amountUsdt: parsed.data.amountUsdt,
    shares: parsed.data.shares,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

