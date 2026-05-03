import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { getSessionUserId } from "@/lib/session";

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
  return NextResponse.json({ deposit: row });
}
