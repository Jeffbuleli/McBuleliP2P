import { eq } from "drizzle-orm";
import { getDb, userPasskeys, users } from "@/db";
import {
  getOpenWaMcBuleliPhone,
  isOpenWaConfigured,
} from "@/lib/auth/openwa-client";

export type SecurityStatusPayload = {
  email: string;
  emailVerified: boolean;
  pendingEmail: string | null;
  totpEnabled: boolean;
  passkeyCount: number;
  whatsAppVerified: boolean;
  recoveryWaPhone: string | null;
  kycApproved: boolean;
  openWaConfigured: boolean;
  openWaNumber: string | null;
};

export async function getSecurityStatus(
  userId: string,
): Promise<SecurityStatusPayload | null> {
  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      pendingEmail: users.pendingEmail,
      totpEnabledAt: users.totpEnabledAt,
      waVerifiedAt: users.waVerifiedAt,
      recoveryWaPhone: users.recoveryWaPhone,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;

  const passkeys = await db
    .select({ id: userPasskeys.id })
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, userId));

  const openWaConfigured = isOpenWaConfigured();
  const waNumber = openWaConfigured ? await getOpenWaMcBuleliPhone() : null;

  return {
    email: u.email,
    emailVerified: Boolean(u.emailVerifiedAt),
    pendingEmail: u.pendingEmail,
    totpEnabled: Boolean(u.totpEnabledAt),
    passkeyCount: passkeys.length,
    whatsAppVerified: Boolean(u.waVerifiedAt),
    recoveryWaPhone: u.recoveryWaPhone,
    kycApproved: u.kycStatus === "approved",
    openWaConfigured,
    openWaNumber: waNumber,
  };
}

export function isPiSyntheticEmail(email: string): boolean {
  return email.endsWith("@pi.local");
}
