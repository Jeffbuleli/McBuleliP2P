import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  listSocialAidRequests,
  requestSocialAid,
  SOCIAL_AID_MODES,
  SOCIAL_AID_TYPES,
} from "@/lib/avec/social-fund-aid";

const createZ = z.object({
  aidType: z.enum(SOCIAL_AID_TYPES),
  aidMode: z.enum(SOCIAL_AID_MODES),
  amountUsdt: z.number().positive(),
  justification: z.string().min(10).max(2000),
  proofAttachmentUrl: z.string().url().optional().nullable(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await listSocialAidRequests({ groupId: id, userId });
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
  const r = await requestSocialAid({
    groupId: id,
    requesterUserId: userId,
    aidType: parsed.data.aidType,
    aidMode: parsed.data.aidMode,
    amountUsdt: parsed.data.amountUsdt,
    justification: parsed.data.justification,
    proofAttachmentUrl: parsed.data.proofAttachmentUrl,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json(r);
}
