import { eq } from "drizzle-orm";
import type { Locale } from "@/i18n/locale";
import { adminKycHelpTier } from "@/lib/admin-kyc-help";
import { getSecurityStatus } from "@/lib/auth/security-status";
import { getOwnCommunityProfile } from "@/lib/community/profile-service";
import { getDb, users } from "@/db";
import { getKycStatusPayload } from "@/lib/kyc-status-payload";
import { getNotificationPrefs } from "@/lib/notification-prefs";
import { getP2pMerchantProfile } from "@/lib/p2p-merchant-service";
import { getProfileDashboard } from "@/lib/profile-stats";
import { getReferralSnapshot } from "@/lib/referral-service";
import { getTradeLiveGovernance } from "@/lib/trade-live-governance";

export async function getAdminUser360(userId: string, locale: Locale) {
  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      staffScopes: users.staffScopes,
      createdAt: users.createdAt,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      countryCode: users.countryCode,
      piUsername: users.piUsername,
      piUid: users.piUid,
      referralCode: users.referralCode,
      referredByUserId: users.referredByUserId,
      buleliPointsBalance: users.buleliPointsBalance,
      tradeLiveEnabled: users.tradeLiveEnabled,
      emailVerifiedAt: users.emailVerifiedAt,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      birthDate: users.birthDate,
      documentNumber: users.documentNumber,
      documentType: users.documentType,
      documentCountry: users.documentCountry,
      kycStatus: users.kycStatus,
      kycUpdatedAt: users.kycUpdatedAt,
      kycRejectionNote: users.kycRejectionNote,
      diditSessionId: users.diditSessionId,
      diditSessionStatus: users.diditSessionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [
    overview,
    kyc,
    security,
    p2p,
    community,
    referral,
    notificationPrefs,
    tradeGovernance,
  ] = await Promise.all([
    getProfileDashboard(userId, locale),
    getKycStatusPayload(userId),
    getSecurityStatus(userId),
    getP2pMerchantProfile(userId),
    getOwnCommunityProfile(userId).catch(() => null),
    getReferralSnapshot(userId).catch(() => null),
    getNotificationPrefs(userId),
    getTradeLiveGovernance(userId),
  ]);

  let referrerEmail: string | null = null;
  if (user.referredByUserId) {
    const [ref] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, user.referredByUserId))
      .limit(1);
    referrerEmail = ref?.email ?? null;
  }

  const kycHelpTier = adminKycHelpTier({
    kycStatus: user.kycStatus,
    kycUpdatedAt: user.kycUpdatedAt,
    diditSessionStatus: user.diditSessionStatus,
    diditSessionId: user.diditSessionId,
    kycRejectionNote: user.kycRejectionNote,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      staffScopes: user.staffScopes,
      createdAt: user.createdAt.toISOString(),
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      countryCode: user.countryCode,
      piUsername: user.piUsername,
      piUid: user.piUid,
      piLinked: Boolean(user.piUsername?.trim() || user.piUid?.trim()),
      referralCode: user.referralCode,
      referrerEmail,
      buleliPointsBalance: user.buleliPointsBalance,
      tradeLiveEnabled: user.tradeLiveEnabled,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    },
    overview,
    kyc: kyc
      ? {
          ...kyc,
          helpTier: kycHelpTier,
          legal: {
            legalFirstName: user.legalFirstName,
            legalLastName: user.legalLastName,
            birthDate: user.birthDate,
            documentNumber: user.documentNumber,
            documentType: user.documentType,
            documentCountry: user.documentCountry,
          },
        }
      : null,
    security,
    p2p,
    community,
    referral,
    notificationPrefs,
    tradeGovernance,
  };
}
