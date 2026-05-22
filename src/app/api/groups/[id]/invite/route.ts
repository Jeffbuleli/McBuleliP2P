import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { ensureGroupInviteCode } from "@/lib/group-invite";
import { getMyMembershipOrNull, hasRole } from "@/lib/group-savings-permissions";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const m = await getMyMembershipOrNull({ groupId: id, userId });
  if (!m || !hasRole(m, ["admin", "co_admin"])) {
    return NextResponse.json({ error: "group_forbidden" }, { status: 403 });
  }
  const code = await ensureGroupInviteCode(id);
  if (!code) return NextResponse.json({ error: "group_invite_unavailable" }, { status: 400 });
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const path = `/app/wallet/groups/join?code=${encodeURIComponent(code)}`;
  return NextResponse.json({
    inviteCode: code,
    invitePath: path,
    inviteUrl: origin ? `${origin}${path}` : path,
  });
}
