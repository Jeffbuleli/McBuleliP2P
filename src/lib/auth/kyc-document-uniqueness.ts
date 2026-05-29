import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { getDb, users } from "@/db";

const ACTIVE_KYC = ["approved", "manual_review", "pending"] as const;

/** Another account already verified with this identity document. */
export async function findKycDocumentConflict(args: {
  userId: string;
  documentNumber: string | null | undefined;
}): Promise<{ userId: string; email: string } | null> {
  const doc = args.documentNumber?.trim().toUpperCase();
  if (!doc || doc.length < 4) return null;

  const db = getDb();
  const [row] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      and(
        ne(users.id, args.userId),
        inArray(users.kycStatus, [...ACTIVE_KYC]),
        sql`upper(trim(${users.documentNumber})) = ${doc}`,
      ),
    )
    .limit(1);

  return row ? { userId: row.id, email: row.email } : null;
}
