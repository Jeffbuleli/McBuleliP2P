import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups, users } from "@/db";
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
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [row] = await db
    .select({
      id: groupSavingsGroups.id,
      type: groupSavingsGroups.type,
      name: groupSavingsGroups.name,
      status: groupSavingsGroups.status,
      subscriptionStatus: groupSavingsGroups.subscriptionStatus,
      contributionAmountUsdt: groupSavingsGroups.contributionAmountUsdt,
      cycleDurationDays: groupSavingsGroups.cycleDurationDays,
      maxSharesPerMeeting: groupSavingsGroups.maxSharesPerMeeting,
      meetingIntervalDays: groupSavingsGroups.meetingIntervalDays,
      socialFundUsdt: groupSavingsGroups.socialFundUsdt,
      countryCode: groupSavingsGroups.countryCode,
      nextBillingAt: groupSavingsGroups.nextBillingAt,
      createdAt: groupSavingsGroups.createdAt,
      createdByUserId: groupSavingsGroups.createdByUserId,
      createdByEmail: users.email,
      rejectionReason: groupSavingsGroups.rejectionReason,
    })
    .from(groupSavingsGroups)
    .innerJoin(users, eq(groupSavingsGroups.createdByUserId, users.id))
    .where(eq(groupSavingsGroups.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    group: {
      ...row,
      contributionAmountUsdt: row.contributionAmountUsdt?.toString() ?? "0",
      socialFundUsdt: row.socialFundUsdt?.toString() ?? "0",
      nextBillingAt: row.nextBillingAt ? row.nextBillingAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    },
  });
}
