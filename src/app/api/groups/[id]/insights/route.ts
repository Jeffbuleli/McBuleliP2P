import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getGroupFinancialInsights } from "@/lib/avec/financial-ai-service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await ctx.params;
  const locale = new URL(req.url).searchParams.get("locale") === "fr" ? "fr" : "en";

  const r = await getGroupFinancialInsights({ groupId, userId, locale });
  if (!r.ok) {
    const status = r.message === "group_forbidden" ? 403 : 404;
    return NextResponse.json({ error: r.message }, { status });
  }
  return NextResponse.json(r);
}
