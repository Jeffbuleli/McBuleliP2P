import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  type KycGatedFeature,
  kycRequiredForFeature,
  isKycApproved,
  kycEnabled,
} from "@/lib/kyc-policy";

export type KycGuardResult =
  | { ok: true; kycStatus: string; countryCode: string | null }
  | { ok: false; error: "kyc_required" | "kyc_country_unsupported" };

export async function checkKycGate(
  userId: string,
  feature: KycGatedFeature,
): Promise<KycGuardResult> {
  if (!kycEnabled()) {
    return { ok: true, kycStatus: "none", countryCode: null };
  }

  const db = getDb();
  const [u] = await db
    .select({
      kycStatus: users.kycStatus,
      countryCode: users.countryCode,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) return { ok: false, error: "kyc_required" };

  const cc = u.countryCode ?? null;
  if (!kycRequiredForFeature(feature, cc)) {
    return { ok: true, kycStatus: u.kycStatus ?? "none", countryCode: cc };
  }

  if (!cc || cc === "OTHER") {
    return { ok: false, error: "kyc_country_unsupported" };
  }

  if (!isKycApproved(u.kycStatus)) {
    return { ok: false, error: "kyc_required" };
  }

  return { ok: true, kycStatus: u.kycStatus ?? "none", countryCode: cc };
}
