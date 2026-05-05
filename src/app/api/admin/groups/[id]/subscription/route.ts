import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, groupSubscriptionInvoices } from "@/db";
import { requireStaffScope, StaffAuthError } from "@/lib/session-user";

export async function GET(
  req: Request,
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

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") ?? "24");
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 24), 60);

  const { id } = await ctx.params;
  const db = getDb();
  const rows = await db
    .select({
      id: groupSubscriptionInvoices.id,
      period: groupSubscriptionInvoices.period,
      amountUsdt: groupSubscriptionInvoices.amountUsdt,
      status: groupSubscriptionInvoices.status,
      attemptedAt: groupSubscriptionInvoices.attemptedAt,
      paidAt: groupSubscriptionInvoices.paidAt,
      failureReason: groupSubscriptionInvoices.failureReason,
      createdAt: groupSubscriptionInvoices.createdAt,
    })
    .from(groupSubscriptionInvoices)
    .where(eq(groupSubscriptionInvoices.groupId, id))
    .orderBy(desc(groupSubscriptionInvoices.createdAt))
    .limit(limit);

  return NextResponse.json({
    invoices: rows.map((r) => ({
      ...r,
      attemptedAt: r.attemptedAt ? r.attemptedAt.toISOString() : null,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}

