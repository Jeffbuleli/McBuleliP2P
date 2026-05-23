import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  kycEnabled,
  kycRequiredCountries,
  isKycApproved,
} from "@/lib/kyc-policy";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";
import { diditConfigured } from "@/lib/didit/config";
import { diditApiConfigured } from "@/lib/didit/api";

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
  canRefreshStatus: boolean;
  diditSessionId: string | null;
  /** Didit session status when a session exists (In Progress, In Review, …). */
  diditSessionStatus: string | null;
  didit: {
    configured: boolean;
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
  diditSessionId?: string | null;
  diditSessionStatus?: string | null;
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
    didit: {
      configured: diditConfigured(),
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
        diditSessionId?: string | null;
        diditSessionStatus?: string | null;
      }
    | undefined;

  try {
    [row] = await db
      .select({
        kycStatus: users.kycStatus,
        countryCode: users.countryCode,
        kycUpdatedAt: users.kycUpdatedAt,
        kycRejectionNote: users.kycRejectionNote,
        diditSessionId: users.diditSessionId,
        diditSessionStatus: users.diditSessionStatus,
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
    diditSessionId: row.diditSessionId,
    diditSessionStatus: row.diditSessionStatus,
  });
}
