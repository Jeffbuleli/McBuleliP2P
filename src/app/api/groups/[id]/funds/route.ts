import { NextResponse } from "next/server";
import { getGroupFundSummary } from "@/lib/avec/fund-buckets";
import { fetchGroupById } from "@/lib/group-savings-read";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { getSessionUserId } from "@/lib/session";
import { numFromNumeric } from "@/lib/wallet-types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const m = await getMyMembershipOrNull({ groupId: id, userId });
  if (!m || m.status !== "approved") {
    return NextResponse.json({ error: "group_forbidden" }, { status: 403 });
  }

  const g = await fetchGroupById(id);
  if (!g) return NextResponse.json({ error: "group_not_found" }, { status: 404 });

  const shareValue = numFromNumeric(g.contributionAmountUsdt?.toString());
  const funds = await getGroupFundSummary(id, shareValue);

  return NextResponse.json({ ok: true, funds });
}
