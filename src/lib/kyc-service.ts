import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { createUserNotification } from "@/lib/notifications-service";
import type { KycStatus } from "@/lib/kyc-policy";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";

export type MetamapVerificationOutcome = "verified" | "reviewNeeded" | "rejected" | "unknown";

export function mapMetamapOutcomeToKycStatus(
  outcome: MetamapVerificationOutcome,
): KycStatus {
  if (outcome === "verified") return "approved";
  if (outcome === "reviewNeeded") return "manual_review";
  if (outcome === "rejected") return "rejected";
  return "pending";
}

/** Reset to initial state so the user can start MetaMap again (non-sanctions). */
export async function resetUserKycForRetry(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: "none",
      kycUpdatedAt: new Date(),
      kycRejectionNote: null,
    })
    .where(eq(users.id, userId));
}

export async function setUserKycPending(args: {
  userId: string;
  metamapIdentityId?: string | null;
  metamapVerificationId?: string | null;
}): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: "pending",
      kycUpdatedAt: new Date(),
      kycRejectionNote: null,
      ...(args.metamapIdentityId != null
        ? { metamapIdentityId: args.metamapIdentityId }
        : {}),
      ...(args.metamapVerificationId != null
        ? { metamapVerificationId: args.metamapVerificationId }
        : {}),
    })
    .where(eq(users.id, args.userId));

  await createUserNotification({
    userId: args.userId,
    kind: "kyc_pending",
    payload: {},
  });
}

export async function applyKycFromMetamap(args: {
  userId: string;
  outcome: MetamapVerificationOutcome;
  metamapIdentityId?: string | null;
  metamapVerificationId?: string | null;
  rejectionNote?: string | null;
}): Promise<KycStatus> {
  const note = args.rejectionNote?.slice(0, 500) ?? null;

  if (args.outcome === "rejected" && !isKycSanctionsRejection(note)) {
    await resetUserKycForRetry(args.userId);
    return "none";
  }

  const status = mapMetamapOutcomeToKycStatus(args.outcome);
  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: status,
      kycUpdatedAt: new Date(),
      kycRejectionNote:
        status === "rejected" ? note : null,
      ...(args.metamapIdentityId != null
        ? { metamapIdentityId: args.metamapIdentityId }
        : {}),
      ...(args.metamapVerificationId != null
        ? { metamapVerificationId: args.metamapVerificationId }
        : {}),
    })
    .where(eq(users.id, args.userId));

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

  return status;
}

/** MetaMap duplicate / already-verified — sync McBuleli when webhook was missed. */
export async function approveKycFromMetamapDuplicate(args: {
  userId: string;
  metamapIdentityId?: string | null;
  metamapVerificationId?: string | null;
}): Promise<KycStatus> {
  return applyKycFromMetamap({
    userId: args.userId,
    outcome: "verified",
    metamapIdentityId: args.metamapIdentityId,
    metamapVerificationId: args.metamapVerificationId,
    rejectionNote: null,
  });
}

export async function getUserKycRow(userId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      kycStatus: users.kycStatus,
      kycRejectionNote: users.kycRejectionNote,
      metamapIdentityId: users.metamapIdentityId,
      metamapVerificationId: users.metamapVerificationId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

export async function resolveUserIdFromMetamapMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Promise<string | null> {
  const raw = metadata?.userId ?? metadata?.user_id;
  if (typeof raw !== "string" || raw.length < 8) return null;
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, raw))
    .limit(1);
  return u?.id ?? null;
}

export async function resolveUserIdByMetamapVerificationId(
  verificationId: string,
): Promise<string | null> {
  const id = verificationId.trim();
  if (!id) return null;
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.metamapVerificationId, id))
    .limit(1);
  return u?.id ?? null;
}

export async function resolveUserIdByMetamapIdentityId(
  identityId: string,
): Promise<string | null> {
  const id = identityId.trim();
  if (!id) return null;
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.metamapIdentityId, id))
    .limit(1);
  return u?.id ?? null;
}
