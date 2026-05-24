import { and, eq, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { diditApiConfigured } from "@/lib/didit/api";
import {
  reconcileUserKycState,
  resetStalePendingKycUsers,
} from "@/lib/didit/reconcile-stale-kyc";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";

const BATCH_LIMIT = 80;

export type SyncPendingKycResult = {
  scanned: number;
  updated: number;
  reset: number;
  errors: number;
  skipped: boolean;
};

/** Cron: refresh Didit sessions + reset stale pending (>1h, legacy Metamap orphans). */
export async function syncPendingUsersKycFromDidit(): Promise<SyncPendingKycResult> {
  const staleOut = await resetStalePendingKycUsers();

  if (!diditApiConfigured()) {
    return {
      scanned: staleOut.scanned,
      updated: staleOut.reconciled,
      reset: staleOut.reset,
      errors: staleOut.errors,
      skipped: true,
    };
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        or(eq(users.kycStatus, "pending"), eq(users.kycStatus, "manual_review")),
      ),
    )
    .limit(BATCH_LIMIT);

  let updated = 0;
  let errors = staleOut.errors;

  for (const row of rows) {
    try {
      const reconciled = await reconcileUserKycState(row.id);
      if (reconciled) {
        updated += 1;
        continue;
      }
      const result = await refreshUserKycFromDidit(row.id);
      if (!result.ok) {
        if (!result.error.includes("no_session")) errors += 1;
        continue;
      }
      if (result.outcome !== "unknown") updated += 1;
    } catch {
      errors += 1;
    }
  }

  return {
    scanned: rows.length + staleOut.scanned,
    updated,
    reset: staleOut.reset,
    errors,
    skipped: false,
  };
}
