import { NextResponse } from "next/server";
import { z } from "zod";
import { setAdCampaignStatus } from "@/lib/community/mcb-custodial-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  status: z.enum(["approved", "active", "paused", "rejected"]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid_body" }, { status: 400 });
  }

  const result = await setAdCampaignStatus({
    campaignId: id,
    status: parsed.data.status,
  });
  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
