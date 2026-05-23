import { and, eq, isNotNull, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { diditApiConfigured } from "@/lib/didit/api";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";

const BATCH_LIMIT = 80;

export type SyncPendingKycResult = {
  scanned: number;
  updated: number;
  errors: number;
  skipped: boolean;
};

/** Cron: refresh users stuck in pending/manual_review with a Didit session id. */
export async function syncPendingUsersKycFromDidit(): Promise<SyncPendingKycResult> {
  if (!diditApiConfigured()) {
    return { scanned: 0, updated: 0, errors: 0, skipped: true };
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        isNotNull(users.diditSessionId),
        or(
          eq(users.kycStatus, "pending"),
          eq(users.kycStatus, "manual_review"),
        ),
      ),
    )
    .limit(BATCH_LIMIT);

  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const result = await refreshUserKycFromDidit(row.id);
    if (!result.ok) {
      errors += 1;
      continue;
    }
    if (result.outcome !== "unknown") updated += 1;
  }

  return {
    scanned: rows.length,
    updated,
    errors,
    skipped: false,
  };
}
