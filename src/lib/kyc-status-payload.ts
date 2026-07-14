import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  kycEnabled,
  kycEligibleCountry,
  isKycApproved,
} from "@/lib/kyc-policy";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";
import { diditConfigured } from "@/lib/didit/config";
import { diditApiConfigured } from "@/lib/didit/api";
import type { KycLegalIdentity } from "@/lib/kyc-identity";

export type KycStatusPayload = {
  enabled: boolean;
  /** @deprecated Alias — true when KYC is enabled and country is eligible (global Didit). */
  corridor: boolean;
  /** User country is set and not OTHER — required to start Didit. */
  inCorridorCountry: boolean;
  kycStatus: string;
  approved: boolean;
  countryCode: string | null;
  kycUpdatedAt: string | null;
  rejectionNote: string | null;
  sanctionsBlocked: boolean;
  canRetryKyc: boolean;
  canRefreshStatus: boolean;
  diditSessionId: string | null;
  diditSessionStatus: string | null;
  legalIdentity: KycLegalIdentity | null;
  didit: {
    configured: boolean;
  };
};

export function buildKycStatusPayload(args: {
  countryCode: string | null | undefined;
  kycStatus: string | null | undefined;
  kycUpdatedAt?: Date | null;
  kycRejectionNote?: string | null;
  diditSessionId?: string | null;
  diditSessionStatus?: string | null;
  legalIdentity?: KycLegalIdentity | null;
}): KycStatusPayload {
  const enabled = kycEnabled();
  const inCorridorCountry = kycEligibleCountry(args.countryCode);
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

  const hasSessionId = Boolean(args.diditSessionId?.trim());
  const canRefreshStatus =
    diditApiConfigured() &&
    !approved &&
    hasSessionId &&
    (kycStatus === "pending" || kycStatus === "manual_review");

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
    canRefreshStatus,
    diditSessionId: args.diditSessionId ?? null,
    diditSessionStatus: args.diditSessionStatus?.trim() || null,
    legalIdentity: args.legalIdentity ?? null,
    didit: {
      configured: diditConfigured(),
    },
  };
}

export async function getKycStatusPayload(
  userId: string,
): Promise<KycStatusPayload | null> {
  const db = getDb();
  const [row] = await db
    .select({
      kycStatus: users.kycStatus,
      countryCode: users.countryCode,
      kycUpdatedAt: users.kycUpdatedAt,
      kycRejectionNote: users.kycRejectionNote,
      diditSessionId: users.diditSessionId,
      diditSessionStatus: users.diditSessionStatus,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      birthDate: users.birthDate,
      documentNumber: users.documentNumber,
      documentType: users.documentType,
      documentCountry: users.documentCountry,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  const hasLegal =
    row.legalFirstName ||
    row.legalLastName ||
    row.documentNumber ||
    row.birthDate;

  return buildKycStatusPayload({
    countryCode: row.countryCode,
    kycStatus: row.kycStatus,
    kycUpdatedAt: row.kycUpdatedAt,
    kycRejectionNote: row.kycRejectionNote,
    diditSessionId: row.diditSessionId,
    diditSessionStatus: row.diditSessionStatus,
    legalIdentity: hasLegal
      ? {
          legalFirstName: row.legalFirstName ?? null,
          legalLastName: row.legalLastName ?? null,
          birthDate: row.birthDate ?? null,
          documentNumber: row.documentNumber ?? null,
          documentType: row.documentType ?? null,
          documentCountry: row.documentCountry ?? null,
        }
      : null,
  });
}
