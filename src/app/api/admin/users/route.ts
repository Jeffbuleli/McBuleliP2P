import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getDb, users } from "@/db";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const db = getDb();
  const list = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      staffScopes: users.staffScopes,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.email));

  return NextResponse.json({ users: list });
}
