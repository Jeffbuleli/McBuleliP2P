import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsGroups, users } from "@/db";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireStaffScope("groups");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ error: "admin_forbidden" }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statusRaw = (statusParam ?? "pending").trim();
  const subscriptionStatus = (searchParams.get("subscriptionStatus") ?? "")
    .trim()
    .toLowerCase();

  const db = getDb();
  const base = db
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

  const conds = [];
  if (statusRaw === "all") {
    // no lifecycle status filter
  } else if (statusRaw.includes(",")) {
    const parts = statusRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length === 1) {
      conds.push(eq(groupSavingsGroups.status, parts[0]!));
    } else if (parts.length > 1) {
      conds.push(inArray(groupSavingsGroups.status, parts));
    }
  } else {
    conds.push(eq(groupSavingsGroups.status, statusRaw.toLowerCase()));
  }
  if (subscriptionStatus) {
    conds.push(eq(groupSavingsGroups.subscriptionStatus, subscriptionStatus));
  }

  const rows =
    conds.length > 0 ? await base.where(and(...conds)) : await base;

  return NextResponse.json({
    groups: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

