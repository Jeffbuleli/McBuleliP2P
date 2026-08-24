import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

/** Console MC / télécommande Live : staff connecté uniquement. */
export async function mcControlAuthorized(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AGENT;
}

export async function requireMcControl(): Promise<void> {
  if (!(await mcControlAuthorized())) {
    throw new McControlAuthError();
  }
}

/** User id for slide session writes (nullable if session expired). */
export async function mcOperatorUserId(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.AGENT) {
    return null;
  }
  return user.id;
}

export class McControlAuthError extends Error {
  constructor() {
    super("forbidden");
    this.name = "McControlAuthError";
  }
}
