import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import type { UserRoleType } from "@/lib/roles";
import { UserRole } from "@/lib/roles";
import { agentHasScope, normalizeStaffScopesJson, type StaffScope } from "@/lib/staff-scopes";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRoleType;
  /** Set for agents; `null` = all modules (legacy). */
  staffScopes: StaffScope[] | null;
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
      staffScopes: users.staffScopes,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!row) return null;
  let staffScopes: StaffScope[] | null = null;
  if (row.role === UserRole.AGENT) {
    staffScopes =
      row.staffScopes == null
        ? null
        : normalizeStaffScopesJson(row.staffScopes);
  }
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRoleType,
    staffScopes,
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

/** Agent with scope, or super-admin. */
export async function requireStaffScope(
  scope: StaffScope,
): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) {
    throw new StaffAuthError("Forbidden");
  }
  if (u.role === UserRole.SUPER_ADMIN) {
    return u;
  }
  if (!agentHasScope(u, scope)) {
    throw new StaffAuthError("Forbidden");
  }
  return u;
}

export class StaffAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StaffAuthError";
  }
}
