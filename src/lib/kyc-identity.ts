import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { resetUserKycForResubmit } from "@/lib/kyc-service";

export type KycLegalIdentity = {
  legalFirstName: string | null;
  legalLastName: string | null;
  birthDate: string | null;
  documentNumber: string | null;
  documentType: string | null;
  documentCountry: string | null;
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

export async function updateUserKycLegalIdentity(
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

export async function resubmitUserKycIdentity(
  userId: string,
  patch?: z.infer<typeof kycIdentityPatchZ>,
): Promise<void> {
  if (patch && Object.keys(patch).length) {
    await updateUserKycLegalIdentity(userId, patch);
  }
  await resetUserKycForResubmit(userId);
}
