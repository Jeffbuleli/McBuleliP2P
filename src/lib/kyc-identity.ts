import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

export type KycLegalIdentity = {
  legalFirstName: string | null;
  legalLastName: string | null;
  birthDate: string | null;
  documentNumber: string | null;
  documentType: string | null;
  documentCountry: string | null;
};

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
