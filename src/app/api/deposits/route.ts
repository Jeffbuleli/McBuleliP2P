import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const list = await db
    .select()
    .from(deposits)
    .where(eq(deposits.userId, userId))
    .orderBy(desc(deposits.createdAt))
    .limit(50);
  return NextResponse.json({ deposits: list });
}
