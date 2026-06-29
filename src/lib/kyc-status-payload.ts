import type { KycIdentityCorrection } from "@/lib/kyc-identity";
import { isMissingKycIdentityCorrectionColumnsError } from "@/lib/kyc-identity-correction-schema";
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
  /** @deprecated Alias - true when KYC is enabled and country is eligible (global Didit). */
  corridor: boolean;
  /** User country is set and not OTHER - required to start Didit. */
  inCorridorCountry: boolean;
  kycStatus: string;
  approved: boolean;
  countryCode: string | null;
  kycUpdatedAt: string | null;
  rejectionNote: string | null;
  sanctionsBlocked: boolean;
  canRetryKyc: boolean;
  /** Rejected / not started users can resubmit after correcting legal identity. */
  canResubmitKyc: boolean;
  /** Approved users request an OPS correction - Didit re-verification (no manual rename). */
  canRequestIdentityCorrection: boolean;
  /** User must complete a Didit re-verification after OPS triggered resubmission. */
  identityReverificationPending: boolean;
  identityCorrection: KycIdentityCorrection | null;
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
  identityCorrection?: KycIdentityCorrection | null;
  /** False when DB migration 0097 is not applied yet. */
  identityCorrectionEnabled?: boolean;
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
  const canResubmitKyc =
    corridor &&
    !approved &&
    !sanctionsBlocked &&
    diditConfigured() &&
    (kycStatus === "rejected" || kycStatus === "none");
  const identityCorrection = args.identityCorrection ?? null;
  const canRequestIdentityCorrection =
    (args.identityCorrectionEnabled ?? true) &&
    corridor &&
    approved &&
    !sanctionsBlocked &&
    identityCorrection?.status !== "requested" &&
    identityCorrection?.status !== "reverification";
  const identityReverificationPending =
    identityCorrection?.status === "reverification";

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
    canResubmitKyc,
    canRequestIdentityCorrection,
    identityReverificationPending,
    identityCorrection,
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
  const baseSelect = {
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
  } as const;

  let row:
    | ({
        kycStatus: string;
        countryCode: string | null;
        kycUpdatedAt: Date | null;
        kycRejectionNote: string | null;
        diditSessionId: string | null;
        diditSessionStatus: string | null;
        legalFirstName: string | null;
        legalLastName: string | null;
        birthDate: string | null;
        documentNumber: string | null;
        documentType: string | null;
        documentCountry: string | null;
        kycIdentityCorrectionStatus?: string | null;
        kycIdentityCorrectionRequestedAt?: Date | null;
        kycIdentityProposedFirstName?: string | null;
        kycIdentityProposedLastName?: string | null;
        kycIdentityCorrectionNote?: string | null;
        kycIdentityCorrectedAt?: Date | null;
      })
    | undefined;

  let identityCorrectionEnabled = true;

  try {
    [row] = await db
      .select({
        ...baseSelect,
        kycIdentityCorrectionStatus: users.kycIdentityCorrectionStatus,
        kycIdentityCorrectionRequestedAt: users.kycIdentityCorrectionRequestedAt,
        kycIdentityProposedFirstName: users.kycIdentityProposedFirstName,
        kycIdentityProposedLastName: users.kycIdentityProposedLastName,
        kycIdentityCorrectionNote: users.kycIdentityCorrectionNote,
        kycIdentityCorrectedAt: users.kycIdentityCorrectedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  } catch (e) {
    if (!isMissingKycIdentityCorrectionColumnsError(e)) throw e;
    identityCorrectionEnabled = false;
    [row] = await db
      .select(baseSelect)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
  }

  if (!row) return null;

  const hasLegal =
    row.legalFirstName ||
    row.legalLastName ||
    row.documentNumber ||
    row.birthDate;

  const correctionStatus = row.kycIdentityCorrectionStatus ?? null;
  const identityCorrection: KycIdentityCorrection | null =
    correctionStatus === "requested" ||
    correctionStatus === "reverification" ||
    correctionStatus === "corrected"
      ? {
          status: correctionStatus,
          requestedAt: row.kycIdentityCorrectionRequestedAt?.toISOString() ?? null,
          proposedFirstName: row.kycIdentityProposedFirstName ?? null,
          proposedLastName: row.kycIdentityProposedLastName ?? null,
          note: row.kycIdentityCorrectionNote ?? null,
          correctedAt: row.kycIdentityCorrectedAt?.toISOString() ?? null,
        }
      : null;

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
    identityCorrection,
    identityCorrectionEnabled,
  });
}
