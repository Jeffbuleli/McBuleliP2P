import { and, eq, ne, sql } from "drizzle-orm";
import { getDb, users } from "@/db";

/** Normalize for case-insensitive uniqueness (trim + lowercase). */
export function normalizeDisplayNameForLookup(name: string): string {
  return name.trim().toLowerCase();
}

export async function isDisplayNameTaken(
  displayName: string,
  excludeUserId?: string,
): Promise<boolean> {
  const normalized = normalizeDisplayNameForLookup(displayName);
  if (normalized.length < 2) return false;

  const db = getDb();
  const conds = [sql`lower(trim(${users.displayName})) = ${normalized}`];
  if (excludeUserId) {
    conds.push(ne(users.id, excludeUserId));
  }

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conds))
    .limit(1);

  return Boolean(row);
}
