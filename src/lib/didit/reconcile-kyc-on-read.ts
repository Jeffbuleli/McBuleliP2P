import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getUserKycRow, resetUserKycForRetry } from "@/lib/kyc-service";
import { restoreApprovedKycFromHistory } from "@/lib/kyc-restore-from-history";
import { reconcileUserKycState } from "@/lib/didit/reconcile-stale-kyc";

/** Heal inconsistent KYC rows when the user opens status / KYC UI. */
export async function reconcileKycOnStatusRead(userId: string): Promise<void> {
  const row = await getUserKycRow(userId);
  if (!row) return;

  const status = row.kycStatus ?? "none";

  if (status === "approved") return;

  if (status === "none") {
    if (await restoreApprovedKycFromHistory(userId)) return;
    if (row.diditSessionId?.trim() || row.diditSessionStatus?.trim()) {
      await resetUserKycForRetry(userId);
    }
    return;
  }

  if (status === "pending" || status === "manual_review") {
    await reconcileUserKycState(userId);
  }
}

/** Batch: clear orphan Didit fields on `none` rows (cron / admin). */
export async function healOrphanNoneKycRows(limit = 500): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.kycStatus, "none"),
        or(isNotNull(users.diditSessionId), isNotNull(users.diditSessionStatus)),
      ),
    )
    .limit(limit);

  for (const row of rows) {
    await resetUserKycForRetry(row.id);
  }
  return rows.length;
}
