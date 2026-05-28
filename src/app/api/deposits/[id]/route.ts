import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { getSessionByDepositId } from "@/lib/wallet-deposit-sessions";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const db = getDb();
  const [row] = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, id), eq(deposits.userId, userId)))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await getSessionByDepositId(row.id);
  return NextResponse.json({
    deposit: row,
    session: session
      ? {
          id: session.id,
          status: session.status,
          expectedAmount: String(session.expectedAmount),
          expiresAt: session.expiresAt.toISOString(),
          graceUntil: session.graceUntil.toISOString(),
        }
      : null,
  });
}
