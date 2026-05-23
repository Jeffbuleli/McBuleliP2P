import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  kycEnabled,
  kycRequiredCountries,
  isKycApproved,
} from "@/lib/kyc-policy";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";
import {
  metamapClientId,
  metamapConfigured,
  metamapFlowId,
} from "@/lib/metamap/config";

export type KycStatusPayload = {
  enabled: boolean;
  corridor: boolean;
  inCorridorCountry: boolean;
  kycStatus: string;
  approved: boolean;
  countryCode: string | null;
  kycUpdatedAt: string | null;
  rejectionNote: string | null;
  sanctionsBlocked: boolean;
  canRetryKyc: boolean;
  metamapIdentityId: string | null;
  metamapVerificationId: string | null;
  metamap: {
    configured: boolean;
    clientId: string | null;
    flowId: string | null;
  };
};

function corridorCountry(countryCode: string | null | undefined): boolean {
  const cc = (countryCode ?? "").trim().toUpperCase();
  return Boolean(cc && cc !== "OTHER" && kycRequiredCountries().includes(cc));
}

export function buildKycStatusPayload(args: {
  countryCode: string | null | undefined;
  kycStatus: string | null | undefined;
  kycUpdatedAt?: Date | null;
  kycRejectionNote?: string | null;
  metamapIdentityId?: string | null;
  metamapVerificationId?: string | null;
}): KycStatusPayload {
  const enabled = kycEnabled();
  const inCorridorCountry = corridorCountry(args.countryCode);
  const corridor = enabled && inCorridorCountry;
  const kycStatus = args.kycStatus ?? "none";
  const approved = isKycApproved(kycStatus);
  const rejectionNote = args.kycRejectionNote ?? null;
  const sanctionsBlocked =
    kycStatus === "rejected" && isKycSanctionsRejection(rejectionNote);
  const canRetryKyc =
    corridor &&
    !approved &&
    !sanctionsBlocked &&
    kycStatus !== "manual_review";

  return {
    enabled,
    corridor,
    inCorridorCountry,
    kycStatus,
    approved,
    countryCode: args.countryCode ?? null,
    kycUpdatedAt: args.kycUpdatedAt?.toISOString() ?? null,
    rejectionNote,
    sanctionsBlocked,
    canRetryKyc,
    metamapIdentityId: args.metamapIdentityId ?? null,
    metamapVerificationId: args.metamapVerificationId ?? null,
    metamap: {
      configured: metamapConfigured(),
      clientId: metamapClientId() || null,
      flowId: metamapFlowId() || null,
    },
  };
}

export async function getKycStatusPayload(
  userId: string,
): Promise<KycStatusPayload | null> {
  const db = getDb();
  let row:
    | {
        kycStatus: string;
        countryCode: string | null;
        kycUpdatedAt: Date | null;
        kycRejectionNote?: string | null;
        metamapIdentityId?: string | null;
        metamapVerificationId?: string | null;
      }
    | undefined;

  try {
    [row] = await db
      .select({
        kycStatus: users.kycStatus,
        countryCode: users.countryCode,
        kycUpdatedAt: users.kycUpdatedAt,
        kycRejectionNote: users.kycRejectionNote,
        metamapIdentityId: users.metamapIdentityId,
        metamapVerificationId: users.metamapVerificationId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  } catch (err) {
    console.warn("[getKycStatusPayload] retry without optional kyc columns", err);
    [row] = await db
      .select({
        kycStatus: users.kycStatus,
        countryCode: users.countryCode,
        kycUpdatedAt: users.kycUpdatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  }

  if (!row) return null;

  return buildKycStatusPayload({
    countryCode: row.countryCode,
    kycStatus: row.kycStatus,
    kycUpdatedAt: row.kycUpdatedAt,
    kycRejectionNote: row.kycRejectionNote,
    metamapIdentityId: row.metamapIdentityId,
    metamapVerificationId: row.metamapVerificationId,
  });
}
