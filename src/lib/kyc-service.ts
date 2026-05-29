import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { findKycDocumentConflict } from "@/lib/auth/kyc-document-uniqueness";
import { createUserNotification } from "@/lib/notifications-service";
import type { KycStatus } from "@/lib/kyc-policy";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";

export type KycVerificationOutcome =
  | "verified"
  | "reviewNeeded"
  | "rejected"
  | "unknown"
  | "abandoned";

export function mapVerificationOutcomeToKycStatus(
  outcome: KycVerificationOutcome,
): KycStatus {
  if (outcome === "verified") return "approved";
  if (outcome === "reviewNeeded") return "manual_review";
  if (outcome === "rejected") return "rejected";
  if (outcome === "abandoned") return "none";
  return "pending";
}

/** Reset to initial state so the user can start verification again (non-sanctions). */
export async function resetUserKycForRetry(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: "none",
      kycUpdatedAt: new Date(),
      kycRejectionNote: null,
      diditSessionId: null,
      diditSessionStatus: null,
    })
    .where(eq(users.id, userId));
}

export async function setUserKycPending(args: {
  userId: string;
  diditSessionId?: string | null;
  diditSessionStatus?: string | null;
}): Promise<void> {
  const before = await getUserKycRow(args.userId);
  const wasPending = before?.kycStatus === "pending";

  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: "pending",
      kycUpdatedAt: new Date(),
      kycRejectionNote: null,
      ...(args.diditSessionId != null
        ? { diditSessionId: args.diditSessionId }
        : {}),
      ...(args.diditSessionStatus != null
        ? { diditSessionStatus: args.diditSessionStatus }
        : {}),
    })
    .where(eq(users.id, args.userId));

  if (!wasPending) {
    await createUserNotification({
      userId: args.userId,
      kind: "kyc_pending",
      payload: args.diditSessionId ? { sessionId: args.diditSessionId } : {},
    });
  }
}

export async function applyKycFromProvider(args: {
  userId: string;
  outcome: KycVerificationOutcome;
  diditSessionId?: string | null;
  diditSessionStatus?: string | null;
  rejectionNote?: string | null;
  ocrPatch?: {
    legalFirstName?: string;
    legalLastName?: string;
    birthDate?: string;
    documentNumber?: string;
    documentType?: string;
    documentCountry?: string;
  } | null;
}): Promise<KycStatus> {
  const note = args.rejectionNote?.slice(0, 500) ?? null;

  if (args.outcome === "abandoned") {
    await resetUserKycForRetry(args.userId);
    return "none";
  }

  if (args.outcome === "rejected" && !isKycSanctionsRejection(note)) {
    await resetUserKycForRetry(args.userId);
    return "none";
  }

  let status = mapVerificationOutcomeToKycStatus(args.outcome);
  const before = await getUserKycRow(args.userId);
  const previousStatus = before?.kycStatus ?? "none";

  let rejectionNote = status === "rejected" ? note : null;
  if (status === "approved" && args.ocrPatch?.documentNumber) {
    const conflict = await findKycDocumentConflict({
      userId: args.userId,
      documentNumber: args.ocrPatch.documentNumber,
    });
    if (conflict) {
      status = "manual_review";
      rejectionNote =
        `Identity document already linked to another account (${conflict.email.slice(0, 3)}***). Contact support.`.slice(
          0,
          500,
        );
    }
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: status,
      kycUpdatedAt: new Date(),
      kycRejectionNote:
        status === "rejected"
          ? note
          : status === "manual_review"
            ? rejectionNote
            : null,
      ...(args.diditSessionId != null
        ? { diditSessionId: args.diditSessionId }
        : {}),
      ...(args.diditSessionStatus != null
        ? { diditSessionStatus: args.diditSessionStatus }
        : {}),
      ...(args.ocrPatch ?? {}),
    })
    .where(eq(users.id, args.userId));

  if (previousStatus !== status) {
    const kind =
      status === "approved"
        ? "kyc_approved"
        : status === "rejected"
          ? "kyc_rejected"
          : status === "manual_review"
            ? "kyc_manual_review"
            : "kyc_pending";

    await createUserNotification({
      userId: args.userId,
      kind,
      payload: note ? { note } : {},
    });
  }

  return status;
}

export async function getUserKycRow(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      kycStatus: users.kycStatus,
      kycUpdatedAt: users.kycUpdatedAt,
      kycRejectionNote: users.kycRejectionNote,
      diditSessionId: users.diditSessionId,
      diditSessionStatus: users.diditSessionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

const MCBULELI_USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Didit vendor_data — McBuleli user UUID. Non-UUID values are ignored (Didit console fixtures). */
export async function resolveUserIdFromVendorData(
  vendorData: string | null | undefined,
): Promise<string | null> {
  const raw = vendorData?.trim();
  if (!raw || !MCBULELI_USER_ID_RE.test(raw)) return null;
  try {
    const db = getDb();
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, raw))
      .limit(1);
    return u?.id ?? null;
  } catch (err) {
    console.warn("[kyc] resolveUserIdFromVendorData failed", { raw, err });
    return null;
  }
}

export async function resolveUserIdByDiditSessionId(
  sessionId: string,
): Promise<string | null> {
  const id = sessionId.trim();
  if (!id) return null;
  try {
    const db = getDb();
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.diditSessionId, id))
      .limit(1);
    return u?.id ?? null;
  } catch (err) {
    console.warn("[kyc] resolveUserIdByDiditSessionId failed", { id, err });
    return null;
  }
}
