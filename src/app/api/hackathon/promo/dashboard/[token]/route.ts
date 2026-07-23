import { NextResponse } from "next/server";
import { getPartnerDashboardStats } from "@/lib/hackathon/promo";

export const dynamic = "force-dynamic";

/** Live partner dashboard stats (token from confirm email). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  try {
    const stats = await getPartnerDashboardStats(token);
    if (!stats) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(stats);
  } catch (e) {
    console.error("[hackathon/promo/dashboard]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
