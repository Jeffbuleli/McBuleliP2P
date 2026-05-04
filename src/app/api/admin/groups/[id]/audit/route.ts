import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, groupAuditLog } from "@/db";
import { requireStaff, StaffAuthError } from "@/lib/session-user";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "80");
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 80), 200);

  const { id } = await ctx.params;
  const db = getDb();
  const rows = await db
    .select({
      id: groupAuditLog.id,
      action: groupAuditLog.action,
      actorUserId: groupAuditLog.actorUserId,
      before: groupAuditLog.before,
      after: groupAuditLog.after,
      createdAt: groupAuditLog.createdAt,
    })
    .from(groupAuditLog)
    .where(eq(groupAuditLog.groupId, id))
    .orderBy(desc(groupAuditLog.createdAt))
    .limit(limit);

  return NextResponse.json({
    audit: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
}

