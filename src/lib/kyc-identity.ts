import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { resetUserKycForResubmit } from "@/lib/kyc-service";
import { isKycApproved } from "@/lib/kyc-policy";

export type KycLegalIdentity = {
  legalFirstName: string | null;
  legalLastName: string | null;
  birthDate: string | null;
  documentNumber: string | null;
  documentType: string | null;
  documentCountry: string | null;
};

export type KycIdentityCorrectionStatus = "requested" | "corrected";

export type KycIdentityCorrection = {
  status: KycIdentityCorrectionStatus | null;
  requestedAt: string | null;
  proposedFirstName: string | null;
  proposedLastName: string | null;
  note: string | null;
  correctedAt: string | null;
};

export const kycIdentityPatchZ = z.object({
  legalFirstName: z.string().trim().min(1).max(128).optional(),
  legalLastName: z.string().trim().min(1).max(128).optional(),
  birthDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  documentNumber: z.string().trim().min(2).max(64).optional().nullable(),
});

export const kycIdentityCorrectionRequestZ = z.object({
  proposedFirstName: z.string().trim().min(1).max(128),
  proposedLastName: z.string().trim().min(1).max(128),
  note: z.string().trim().max(500).optional().nullable(),
});

export const adminKycIdentityCorrectionZ = z.object({
  legalFirstName: z.string().trim().min(1).max(128),
  legalLastName: z.string().trim().min(1).max(128),
});

function mapIdentityCorrection(row: {
  kycIdentityCorrectionStatus: string | null;
  kycIdentityCorrectionRequestedAt: Date | null;
  kycIdentityProposedFirstName: string | null;
  kycIdentityProposedLastName: string | null;
  kycIdentityCorrectionNote: string | null;
  kycIdentityCorrectedAt: Date | null;
}): KycIdentityCorrection {
  const status = row.kycIdentityCorrectionStatus as KycIdentityCorrectionStatus | null;
  return {
    status: status === "requested" || status === "corrected" ? status : null,
    requestedAt: row.kycIdentityCorrectionRequestedAt?.toISOString() ?? null,
    proposedFirstName: row.kycIdentityProposedFirstName ?? null,
    proposedLastName: row.kycIdentityProposedLastName ?? null,
    note: row.kycIdentityCorrectionNote ?? null,
    correctedAt: row.kycIdentityCorrectedAt?.toISOString() ?? null,
  };
}

export async function getUserKycLegalIdentity(
  userId: string,
): Promise<KycLegalIdentity | null> {
  const db = getDb();
  const [row] = await db
    .select({
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
  return {
    legalFirstName: row.legalFirstName ?? null,
    legalLastName: row.legalLastName ?? null,
    birthDate: row.birthDate ?? null,
    documentNumber: row.documentNumber ?? null,
    documentType: row.documentType ?? null,
    documentCountry: row.documentCountry ?? null,
  };
}

export async function getUserKycIdentityCorrection(
  userId: string,
): Promise<KycIdentityCorrection | null> {
  const db = getDb();
  const [row] = await db
    .select({
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
  if (!row) return null;
  return mapIdentityCorrection(row);
}

async function applyUserKycLegalIdentityPatch(
  userId: string,
  patch: z.infer<typeof kycIdentityPatchZ>,
): Promise<KycLegalIdentity | null> {
  const db = getDb();
  const updates: Record<string, string | null> = {};

  if (patch.legalFirstName !== undefined) {
    updates.legalFirstName = patch.legalFirstName.trim().slice(0, 128);
  }
  if (patch.legalLastName !== undefined) {
    updates.legalLastName = patch.legalLastName.trim().slice(0, 128);
  }
  if (patch.birthDate !== undefined) {
    updates.birthDate = patch.birthDate;
  }
  if (patch.documentNumber !== undefined) {
    updates.documentNumber = patch.documentNumber
      ? patch.documentNumber.trim().slice(0, 64)
      : null;
  }

  if (!Object.keys(updates).length) return getUserKycLegalIdentity(userId);

  await db.update(users).set(updates).where(eq(users.id, userId));
  return getUserKycLegalIdentity(userId);
}

export async function updateUserKycLegalIdentity(
  userId: string,
  patch: z.infer<typeof kycIdentityPatchZ>,
): Promise<KycLegalIdentity | null> {
  const db = getDb();
  const [row] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;

  const status = row.kycStatus ?? "none";
  if (
    isKycApproved(status) ||
    status === "pending" ||
    status === "manual_review"
  ) {
    throw new Error("kyc_identity_locked");
  }

  return applyUserKycLegalIdentityPatch(userId, patch);
}

export async function requestUserKycIdentityCorrection(
  userId: string,
  body: z.infer<typeof kycIdentityCorrectionRequestZ>,
): Promise<KycIdentityCorrection> {
  const db = getDb();
  const [row] = await db
    .select({
      kycStatus: users.kycStatus,
      kycIdentityCorrectionStatus: users.kycIdentityCorrectionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row || !isKycApproved(row.kycStatus)) {
    throw new Error("kyc_identity_correction_unavailable");
  }
  if (row.kycIdentityCorrectionStatus === "requested") {
    throw new Error("kyc_identity_correction_pending_error");
  }

  const now = new Date();
  const [updated] = await db
    .update(users)
    .set({
      kycIdentityCorrectionStatus: "requested",
      kycIdentityCorrectionRequestedAt: now,
      kycIdentityProposedFirstName: body.proposedFirstName.trim().slice(0, 128),
      kycIdentityProposedLastName: body.proposedLastName.trim().slice(0, 128),
      kycIdentityCorrectionNote: body.note?.trim().slice(0, 500) ?? null,
    })
    .where(eq(users.id, userId))
    .returning({
      kycIdentityCorrectionStatus: users.kycIdentityCorrectionStatus,
      kycIdentityCorrectionRequestedAt: users.kycIdentityCorrectionRequestedAt,
      kycIdentityProposedFirstName: users.kycIdentityProposedFirstName,
      kycIdentityProposedLastName: users.kycIdentityProposedLastName,
      kycIdentityCorrectionNote: users.kycIdentityCorrectionNote,
      kycIdentityCorrectedAt: users.kycIdentityCorrectedAt,
    });

  if (!updated) throw new Error("kyc_identity_correction_unavailable");
  return mapIdentityCorrection(updated);
}

export async function applyAdminKycIdentityCorrection(args: {
  targetUserId: string;
  adminUserId: string;
  body: z.infer<typeof adminKycIdentityCorrectionZ>;
}): Promise<{ identity: KycLegalIdentity | null; correction: KycIdentityCorrection }> {
  const db = getDb();
  const [row] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, args.targetUserId))
    .limit(1);

  if (!row || !isKycApproved(row.kycStatus)) {
    throw new Error("kyc_identity_correction_unavailable");
  }

  const now = new Date();
  const [updated] = await db
    .update(users)
    .set({
      legalFirstName: args.body.legalFirstName.trim().slice(0, 128),
      legalLastName: args.body.legalLastName.trim().slice(0, 128),
      kycIdentityCorrectionStatus: "corrected",
      kycIdentityCorrectedAt: now,
      kycIdentityCorrectedBy: args.adminUserId,
    })
    .where(eq(users.id, args.targetUserId))
    .returning({
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      birthDate: users.birthDate,
      documentNumber: users.documentNumber,
      documentType: users.documentType,
      documentCountry: users.documentCountry,
      kycIdentityCorrectionStatus: users.kycIdentityCorrectionStatus,
      kycIdentityCorrectionRequestedAt: users.kycIdentityCorrectionRequestedAt,
      kycIdentityProposedFirstName: users.kycIdentityProposedFirstName,
      kycIdentityProposedLastName: users.kycIdentityProposedLastName,
      kycIdentityCorrectionNote: users.kycIdentityCorrectionNote,
      kycIdentityCorrectedAt: users.kycIdentityCorrectedAt,
    });

  if (!updated) throw new Error("kyc_identity_correction_unavailable");

  return {
    identity: {
      legalFirstName: updated.legalFirstName ?? null,
      legalLastName: updated.legalLastName ?? null,
      birthDate: updated.birthDate ?? null,
      documentNumber: updated.documentNumber ?? null,
      documentType: updated.documentType ?? null,
      documentCountry: updated.documentCountry ?? null,
    },
    correction: mapIdentityCorrection(updated),
  };
}

export async function resubmitUserKycIdentity(
  userId: string,
  patch?: z.infer<typeof kycIdentityPatchZ>,
): Promise<void> {
  const db = getDb();
  const [row] = await db
    .select({ kycStatus: users.kycStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const status = row?.kycStatus ?? "none";
  if (isKycApproved(status)) {
    throw new Error("kyc_identity_resubmit_unavailable");
  }
  if (status !== "rejected" && status !== "none") {
    throw new Error("kyc_identity_resubmit_unavailable");
  }

  if (patch && Object.keys(patch).length) {
    await applyUserKycLegalIdentityPatch(userId, patch);
  }
  await resetUserKycForResubmit(userId);
}
