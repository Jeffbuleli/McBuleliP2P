import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, piPlatformPayments } from "@/db";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 100);

  const db = getDb();
  const rows = await db
    .select({
      id: piPlatformPayments.id,
      kind: piPlatformPayments.kind,
      amount: piPlatformPayments.amount,
      memo: piPlatformPayments.memo,
      action: piPlatformPayments.action,
      status: piPlatformPayments.status,
      txid: piPlatformPayments.txid,
      createdAt: piPlatformPayments.createdAt,
      fulfilledAt: piPlatformPayments.fulfilledAt,
    })
    .from(piPlatformPayments)
    .where(and(eq(piPlatformPayments.userId, userId)))
    .orderBy(desc(piPlatformPayments.createdAt))
    .limit(limit);

  return NextResponse.json({
    ok: true,
    payments: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      fulfilledAt: r.fulfilledAt?.toISOString() ?? null,
    })),
  });
}

