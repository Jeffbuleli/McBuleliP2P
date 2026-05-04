import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, groupSavingsGroups, users } from "@/db";
import { requireStaff, StaffAuthError } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "pending").trim();

  const db = getDb();
  const q = db
    .select({
      id: groupSavingsGroups.id,
      type: groupSavingsGroups.type,
      name: groupSavingsGroups.name,
      status: groupSavingsGroups.status,
      subscriptionStatus: groupSavingsGroups.subscriptionStatus,
      contributionAmountUsdt: groupSavingsGroups.contributionAmountUsdt,
      cycleDurationDays: groupSavingsGroups.cycleDurationDays,
      countryCode: groupSavingsGroups.countryCode,
      createdAt: groupSavingsGroups.createdAt,
      createdByEmail: users.email,
    })
    .from(groupSavingsGroups)
    .innerJoin(users, eq(groupSavingsGroups.createdByUserId, users.id))
    .orderBy(desc(groupSavingsGroups.createdAt))
    .limit(100);

  const rows =
    status === "all"
      ? await q
      : await q.where(eq(groupSavingsGroups.status, status));

  return NextResponse.json({
    groups: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

