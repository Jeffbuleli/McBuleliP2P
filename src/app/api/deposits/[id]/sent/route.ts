import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { DepositStatus } from "@/lib/status";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const [d] = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)))
    .limit(1);
  if (!d) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (d.status !== DepositStatus.AWAITING_TRANSFER) {
    return NextResponse.json(
      { error: "Invalid state for this action" },
      { status: 409 },
    );
  }
  const [updated] = await db
    .update(deposits)
    .set({
      status: DepositStatus.AWAITING_TXID,
      userMarkedSentAt: new Date(),
    })
    .where(eq(deposits.id, id))
    .returning();
  return NextResponse.json({ deposit: updated });
}
