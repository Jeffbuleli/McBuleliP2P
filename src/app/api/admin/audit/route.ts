import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, platformAdminAuditLog, users } from "@/db";
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

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "120");
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 120), 500);

  const db = getDb();
  const rows = await db
    .select({
      id: platformAdminAuditLog.id,
      action: platformAdminAuditLog.action,
      resourceType: platformAdminAuditLog.resourceType,
      resourceId: platformAdminAuditLog.resourceId,
      meta: platformAdminAuditLog.meta,
      createdAt: platformAdminAuditLog.createdAt,
      actorUserId: platformAdminAuditLog.actorUserId,
      actorEmail: users.email,
    })
    .from(platformAdminAuditLog)
    .leftJoin(users, eq(platformAdminAuditLog.actorUserId, users.id))
    .orderBy(desc(platformAdminAuditLog.createdAt))
    .limit(limit);

  return NextResponse.json({
    entries: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
