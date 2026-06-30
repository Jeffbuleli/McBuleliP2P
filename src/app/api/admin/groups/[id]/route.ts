import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { fetchGroupById } from "@/lib/group-savings-read";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaffScope("groups");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: "admin_forbidden" }, { status: 403 });
    }
    throw e;
  }

  try {
    const { id: rawId } = await ctx.params;
    const id = typeof rawId === "string" ? rawId.trim() : "";
    if (!id) {
      return NextResponse.json({ error: "admin_not_found" }, { status: 404 });
    }

    const g = await fetchGroupById(id);
    if (!g) {
      return NextResponse.json({ error: "admin_not_found" }, { status: 404 });
    }

    const db = getDb();
    const [creator] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, g.createdByUserId))
      .limit(1);

    return NextResponse.json({
      group: {
        id: g.id,
        type: g.type,
        name: g.name,
        status: g.status,
        subscriptionStatus: g.subscriptionStatus,
        contributionAmountUsdt: g.contributionAmountUsdt?.toString() ?? "0",
        cycleDurationDays: g.cycleDurationDays,
        maxSharesPerMeeting: g.maxSharesPerMeeting,
        meetingIntervalDays: g.meetingIntervalDays,
        socialFundUsdt: g.socialFundUsdt?.toString() ?? "0",
        countryCode: g.countryCode,
        nextBillingAt: g.nextBillingAt ? g.nextBillingAt.toISOString() : null,
        createdAt: g.createdAt.toISOString(),
        createdByUserId: g.createdByUserId,
        createdByEmail: creator?.email ?? "—",
        rejectionReason: g.rejectionReason,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/groups/:id]", err);
    return NextResponse.json({ error: "admin_load_failed" }, { status: 500 });
  }
}
