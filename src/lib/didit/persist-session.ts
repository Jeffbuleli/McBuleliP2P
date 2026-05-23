import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { normalizeDiditSessionStatus } from "@/lib/didit/session-status";

/** Store latest Didit session id + status on the user row. */
export async function persistDiditSessionFields(
  userId: string,
  fields: {
    diditSessionId?: string | null;
    diditSessionStatus?: string | null;
  },
): Promise<void> {
  const patch: Record<string, string | null> = {};
  if (fields.diditSessionId !== undefined) {
    patch.diditSessionId = fields.diditSessionId?.trim() || null;
  }
  if (fields.diditSessionStatus !== undefined) {
    const normalized = normalizeDiditSessionStatus(fields.diditSessionStatus);
    patch.diditSessionStatus = normalized;
  }
  if (!Object.keys(patch).length) return;

  const db = getDb();
  await db.update(users).set(patch).where(eq(users.id, userId));
}
