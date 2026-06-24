import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

export type NotificationPrefs = {
  emailSecurity: boolean;
  emailP2p: boolean;
  emailMarketing: boolean;
  inAppP2p: boolean;
  inAppCommunity: boolean;
  inAppAcademy: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailSecurity: true,
  emailP2p: true,
  emailMarketing: false,
  inAppP2p: true,
  inAppCommunity: true,
  inAppAcademy: true,
};

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function normalizeNotificationPrefs(
  raw: Record<string, unknown> | null | undefined,
): NotificationPrefs {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
  return {
    emailSecurity: isBool(raw.emailSecurity)
      ? raw.emailSecurity
      : DEFAULT_NOTIFICATION_PREFS.emailSecurity,
    emailP2p: isBool(raw.emailP2p) ? raw.emailP2p : DEFAULT_NOTIFICATION_PREFS.emailP2p,
    emailMarketing: isBool(raw.emailMarketing)
      ? raw.emailMarketing
      : DEFAULT_NOTIFICATION_PREFS.emailMarketing,
    inAppP2p: isBool(raw.inAppP2p) ? raw.inAppP2p : DEFAULT_NOTIFICATION_PREFS.inAppP2p,
    inAppCommunity: isBool(raw.inAppCommunity)
      ? raw.inAppCommunity
      : DEFAULT_NOTIFICATION_PREFS.inAppCommunity,
    inAppAcademy: isBool(raw.inAppAcademy)
      ? raw.inAppAcademy
      : DEFAULT_NOTIFICATION_PREFS.inAppAcademy,
  };
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const db = getDb();
  const [row] = await db
    .select({ notificationPrefs: users.notificationPrefs })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return normalizeNotificationPrefs(row?.notificationPrefs ?? null);
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs,
): Promise<NotificationPrefs> {
  const normalized = normalizeNotificationPrefs(prefs);
  const db = getDb();
  await db
    .update(users)
    .set({ notificationPrefs: normalized })
    .where(eq(users.id, userId));
  return normalized;
}
