import { and, eq, isNull, lt, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getUserKycRow, resetUserKycForRetry } from "@/lib/kyc-service";
import { diditApiConfigured } from "@/lib/didit/api";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";
import {
  isKycPendingStale,
  kycStalePendingMs,
  KYC_ABANDONED_DIDIT,
  KYC_IN_FLIGHT_DIDIT,
} from "@/lib/kyc-stale-pending";

/**
 * Heal stuck pending rows (legacy Metamap orphans, network drops, Didit 404):
 * poll Didit when possible, else reset after stale threshold (default 1h).
 */
export async function reconcileUserKycState(userId: string): Promise<boolean> {
  const row = await getUserKycRow(userId);
  if (!row || row.kycStatus === "approved") return false;

  if (row.kycStatus !== "pending" && row.kycStatus !== "manual_review") {
    return false;
  }

  const sessionId = row.diditSessionId?.trim();
  const stale = isKycPendingStale(row.kycUpdatedAt);

  /** Legacy Metamap / failed session create — pending with no Didit session. */
  if (!sessionId) {
    if (stale) {
      await resetUserKycForRetry(userId);
      return true;
    }
    return false;
  }

  if (!diditApiConfigured()) {
    if (stale && row.kycStatus === "pending") {
      await resetUserKycForRetry(userId);
      return true;
    }
    return false;
  }

  const result = await refreshUserKycFromDidit(userId);
  if (result.ok && result.outcome !== "unknown") return true;

  const after = await getUserKycRow(userId);
  if (!after) return false;
  if (after.kycStatus === "approved") return true;
  if (after.kycStatus !== "pending" && after.kycStatus !== "manual_review") {
    return false;
  }

  const dStatus = after.diditSessionStatus?.trim() ?? "";

  if (KYC_ABANDONED_DIDIT.has(dStatus)) {
    await resetUserKycForRetry(userId);
    return true;
  }

  if (
    after.kycStatus === "pending" &&
    stale &&
    (KYC_IN_FLIGHT_DIDIT.has(dStatus) || !dStatus)
  ) {
    await resetUserKycForRetry(userId);
    return true;
  }

  if (
    !result.ok &&
    stale &&
    (result.error.includes("404") ||
      result.error.includes("not_found") ||
      result.error.includes("no_session"))
  ) {
    await resetUserKycForRetry(userId);
    return true;
  }

  return result.ok;
}

export type ResetStalePendingResult = {
  scanned: number;
  reset: number;
  reconciled: number;
  errors: number;
};

/** Batch: reset pending/manual_review stuck > 1h (cron + admin). */
export async function resetStalePendingKycUsers(): Promise<ResetStalePendingResult> {
  const db = getDb();
  const cutoff = new Date(Date.now() - kycStalePendingMs());

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        or(eq(users.kycStatus, "pending"), eq(users.kycStatus, "manual_review")),
        or(
          lt(users.kycUpdatedAt, cutoff),
          isNull(users.kycUpdatedAt),
          isNull(users.diditSessionId),
        ),
      ),
    )
    .limit(200);

  let reset = 0;
  let reconciled = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const before = await getUserKycRow(row.id);
      const changed = await reconcileUserKycState(row.id);
      if (!changed) continue;
      const after = await getUserKycRow(row.id);
      if (before?.kycStatus !== "none" && after?.kycStatus === "none") reset += 1;
      else reconciled += 1;
    } catch (e) {
      errors += 1;
      console.warn("[kyc] resetStalePending failed", row.id, e);
    }
  }

  return { scanned: rows.length, reset, reconciled, errors };
}
