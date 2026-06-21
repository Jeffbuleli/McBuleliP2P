import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { getDb, userNotifications } from "@/db";

export type NotificationKind =
  | "withdrawal_queued"
  | "withdrawal_claimed"
  | "withdrawal_completed"
  | "withdrawal_rejected"
  | "deposit_confirmed"
  | "deposit_launch_reward"
  | "deposit_validation_pending"
  | "p2p_order_created"
  | "p2p_order_paid"
  | "p2p_order_proof"
  | "p2p_order_released"
  | "p2p_order_cancelled"
  | "p2p_order_expired"
  | "p2p_order_disputed"
  | "p2p_order_dispute_released"
  | "p2p_order_dispute_refunded"
  | "p2p_order_message"
  | "p2p_order_support_message"
  | "support_message"
  | "group_message"
  | "group_contribution"
  | "group_payout"
  | "group_member_pending"
  | "group_member_approved"
  | "group_ops_approved"
  | "admin_deposit_order"
  | "admin_deposit_review"
  | "admin_withdrawal_order"
  | "kyc_pending"
  | "kyc_approved"
  | "kyc_rejected"
  | "kyc_manual_review"
  | "academy_session_reminder"
  | "academy_announcement"
  | "academy_cohort_invite"
  | "event_reminder"
  | "community_comment"
  | "community_like"
  | "community_trader_follow";

const KYC_NOTIFICATION_KINDS = new Set<NotificationKind>([
  "kyc_pending",
  "kyc_approved",
  "kyc_rejected",
  "kyc_manual_review",
]);

/** Same KYC kind within this window → skip insert (cron/poll/webhook retries). */
const KYC_NOTIFICATION_DEDUPE_MS = 60 * 60 * 1000;

function isMissingRelationError(e: unknown): boolean {
  const anyE = e as { code?: unknown; cause?: unknown } | null;
  if (!anyE) return false;
  if (anyE.code === "42P01") return true;
  const c = anyE.cause as { code?: unknown } | null;
  return c?.code === "42P01";
}

export async function createUserNotification(args: {
  userId: string;
  kind: NotificationKind;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();

    if (KYC_NOTIFICATION_KINDS.has(args.kind)) {
      const since = new Date(Date.now() - KYC_NOTIFICATION_DEDUPE_MS);
      const [recent] = await db
        .select({ id: userNotifications.id })
        .from(userNotifications)
        .where(
          and(
            eq(userNotifications.userId, args.userId),
            eq(userNotifications.kind, args.kind),
            gte(userNotifications.createdAt, since),
          ),
        )
        .limit(1);
      if (recent) return;
    }

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
  try {
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
  } catch (e) {
    // Deployed app may run before DB migrations are applied.
    if (isMissingRelationError(e)) return [];
    throw e;
  }
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(userNotifications)
      .where(
        and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)),
      );
    const n = Number(row?.c ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch (e) {
    if (isMissingRelationError(e)) return 0;
    throw e;
  }
}

export async function markNotificationsRead(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  try {
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
  } catch (e) {
    if (isMissingRelationError(e)) return;
    throw e;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  try {
    const db = getDb();
    const now = new Date();
    await db
      .update(userNotifications)
      .set({ readAt: now })
      .where(
        and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)),
      );
  } catch (e) {
    if (isMissingRelationError(e)) return;
    throw e;
  }
}
