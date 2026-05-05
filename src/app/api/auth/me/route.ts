import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      balance: users.balance,
      staffScopes: users.staffScopes,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: u });
}
