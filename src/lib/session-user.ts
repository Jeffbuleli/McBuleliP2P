import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import type { UserRoleType } from "@/lib/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRoleType;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const db = getDb();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRoleType,
  };
}

export async function requireStaff(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u || (u.role !== "agent" && u.role !== "super_admin")) {
    throw new StaffAuthError("Forbidden");
  }
  return u;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u || u.role !== "super_admin") {
    throw new StaffAuthError("Super admin only");
  }
  return u;
}

export class StaffAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffAuthError";
  }
}
