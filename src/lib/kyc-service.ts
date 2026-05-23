import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { createUserNotification } from "@/lib/notifications-service";
import type { KycStatus } from "@/lib/kyc-policy";

export type MetamapVerificationOutcome = "verified" | "reviewNeeded" | "rejected" | "unknown";

export function mapMetamapOutcomeToKycStatus(
  outcome: MetamapVerificationOutcome,
): KycStatus {
  if (outcome === "verified") return "approved";
  if (outcome === "reviewNeeded") return "manual_review";
  if (outcome === "rejected") return "rejected";
  return "pending";
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
  const status = mapMetamapOutcomeToKycStatus(args.outcome);
  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: status,
      kycUpdatedAt: new Date(),
      kycRejectionNote:
        status === "rejected" ? (args.rejectionNote?.slice(0, 500) ?? null) : null,
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
    payload: args.rejectionNote ? { note: args.rejectionNote } : {},
  });

  return status;
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
