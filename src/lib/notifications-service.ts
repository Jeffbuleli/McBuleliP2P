import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, userNotifications } from "@/db";

export type NotificationKind =
  | "withdrawal_completed"
  | "withdrawal_rejected"
  | "deposit_confirmed";

export async function createUserNotification(args: {
  userId: string;
  kind: NotificationKind;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(userNotifications).values({
      userId: args.userId,
      kind: args.kind,
      payload: args.payload ?? null,
    });
  } catch {
    // Do not fail deposits / withdrawals if notification insert fails.
  }
}

export type NotificationRow = {
  id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export async function listUserNotifications(
  userId: string,
  limit = 40,
): Promise<NotificationRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: userNotifications.id,
      kind: userNotifications.kind,
      payload: userNotifications.payload,
      readAt: userNotifications.readAt,
      createdAt: userNotifications.createdAt,
    })
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(Math.min(Math.max(1, limit), 100));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    payload: r.payload ?? null,
    readAt: r.readAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(userNotifications)
    .where(
      and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)),
    );
  const n = Number(row?.c ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function markNotificationsRead(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const db = getDb();
  const now = new Date();
  await db
    .update(userNotifications)
    .set({ readAt: now })
    .where(
      and(
        eq(userNotifications.userId, userId),
        inArray(userNotifications.id, ids),
      ),
    );
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .update(userNotifications)
    .set({ readAt: now })
    .where(
      and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)),
    );
}
