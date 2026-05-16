import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { UserRole } from "@/lib/roles";

export async function isSuperAdminUserId(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role === UserRole.SUPER_ADMIN;
}
