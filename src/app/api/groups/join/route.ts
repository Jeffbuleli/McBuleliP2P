import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { findGroupIdByInviteCode } from "@/lib/group-invite";
import { requestJoinGroup } from "@/lib/group-savings-service";

const bodyZ = z.object({
  inviteCode: z.string().trim().min(6).max(16),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const groupId = await findGroupIdByInviteCode(parsed.data.inviteCode);
  if (!groupId) {
    return NextResponse.json({ error: "group_invite_invalid" }, { status: 404 });
  }
  const r = await requestJoinGroup({ groupId, userId });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true, groupId });
}
