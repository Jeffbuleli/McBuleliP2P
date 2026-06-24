import { eq } from "drizzle-orm";
import {
  communityUserProfiles,
  getDb,
  userP2pPaymentMethods,
  users,
} from "@/db";
import { normalizeNotificationPrefs } from "@/lib/notification-prefs";
import { listLoginEvents } from "@/lib/login-events";

export async function buildProfileDataExport(userId: string) {
  const db = getDb();
  const [u] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
      emailVerifiedAt: users.emailVerifiedAt,
      totpEnabledAt: users.totpEnabledAt,
      waVerifiedAt: users.waVerifiedAt,
      referralCode: users.referralCode,
      createdAt: users.createdAt,
      notificationPrefs: users.notificationPrefs,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const [community] = await db
    .select({
      handle: communityUserProfiles.handle,
      bio: communityUserProfiles.bio,
    })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);

  const paymentMethods = await db
    .select({
      id: userP2pPaymentMethods.id,
      methodCode: userP2pPaymentMethods.methodCode,
      countryCode: userP2pPaymentMethods.countryCode,
      accountName: userP2pPaymentMethods.accountName,
      active: userP2pPaymentMethods.active,
      createdAt: userP2pPaymentMethods.createdAt,
    })
    .from(userP2pPaymentMethods)
    .where(eq(userP2pPaymentMethods.userId, userId))
    .limit(50);

  const loginHistory = await listLoginEvents(userId, 50);
  let antiPhishingSet = false;
  try {
    const [ap] = await db
      .select({ hash: users.antiPhishingCodeHash })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    antiPhishingSet = Boolean(ap?.hash);
  } catch {
    antiPhishingSet = false;
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      countryCode: u.countryCode,
      kycStatus: u.kycStatus,
      emailVerified: Boolean(u.emailVerifiedAt),
      totpEnabled: Boolean(u.totpEnabledAt),
      whatsAppVerified: Boolean(u.waVerifiedAt),
      referralCode: u.referralCode,
      memberSince: u.createdAt.toISOString(),
      antiPhishingSet,
    },
    community: community
      ? { handle: community.handle, bio: community.bio }
      : null,
    notificationPrefs: normalizeNotificationPrefs(u.notificationPrefs ?? null),
    paymentMethods: paymentMethods.map((p) => ({
      id: p.id,
      methodCode: p.methodCode,
      countryCode: p.countryCode,
      accountName: p.accountName,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    })),
    recentLogins: loginHistory.map((e) => ({
      method: e.method,
      ip: e.ipAddress,
      device: e.deviceLabel,
      at: e.createdAt.toISOString(),
      success: e.success,
    })),
  };
}
