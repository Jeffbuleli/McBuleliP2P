import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { setGroupGovernanceMode } from "@/lib/avec/governance/set-governance-mode";

const bodyZ = z.object({
  governanceMode: z.enum(["legacy", "hybrid", "full"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await setGroupGovernanceMode({
    groupId: id,
    actorUserId: userId,
    governanceMode: parsed.data.governanceMode,
  });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
