import { NextResponse } from "next/server";
import { and, desc, eq, ilike, inArray, ne, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  adminKycHelpTier,
  adminKycNeedsHelp,
} from "@/lib/admin-kyc-help";
import { kycRequiredCountries } from "@/lib/kyc-policy";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status")?.trim().toLowerCase() ?? "";
  const helpOnly = url.searchParams.get("help") === "1";
  const q = url.searchParams.get("q")?.trim() ?? "";

  const corridor = kycRequiredCountries();
  const db = getDb();

  const conditions = [
    or(inArray(users.countryCode, corridor), ne(users.kycStatus, "none")),
  ];
  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(users.kycStatus, statusFilter));
  }
  if (q.length >= 2) {
    conditions.push(ilike(users.email, `%${q}%`));
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
      kycUpdatedAt: users.kycUpdatedAt,
      kycRejectionNote: users.kycRejectionNote,
      diditSessionId: users.diditSessionId,
      diditSessionStatus: users.diditSessionStatus,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.kycUpdatedAt), desc(users.createdAt))
    .limit(500);

  const mapped = rows.map((r) => {
    const helpTier = adminKycHelpTier({
      kycStatus: r.kycStatus,
      kycUpdatedAt: r.kycUpdatedAt,
      diditSessionStatus: r.diditSessionStatus,
      kycRejectionNote: r.kycRejectionNote,
    });
    return {
      ...r,
      kycUpdatedAt: r.kycUpdatedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      helpTier,
    };
  });

  const filtered = helpOnly
    ? mapped.filter((r) => adminKycNeedsHelp(r.helpTier))
    : mapped;

  const totals = {
    all: mapped.length,
    none: mapped.filter((r) => r.kycStatus === "none").length,
    pending: mapped.filter((r) => r.kycStatus === "pending").length,
    manual_review: mapped.filter((r) => r.kycStatus === "manual_review").length,
    approved: mapped.filter((r) => r.kycStatus === "approved").length,
    rejected: mapped.filter((r) => r.kycStatus === "rejected").length,
    needsHelp: mapped.filter((r) => adminKycNeedsHelp(r.helpTier)).length,
  };

  return NextResponse.json({ rows: filtered, totals });
}
