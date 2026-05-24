import { getUserKycRow, resetUserKycForRetry } from "@/lib/kyc-service";
import { diditApiConfigured } from "@/lib/didit/api";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";

/** Pending + SDK in progress longer than this → allow a fresh verification. */
const STALE_IN_PROGRESS_MS = 72 * 60 * 60 * 1000;

const ABANDONED_STATUSES = new Set([
  "Expired",
  "Abandoned",
  "Kyc Expired",
]);

const IN_FLIGHT_STATUSES = new Set([
  "In Progress",
  "Not Started",
  "Awaiting User",
  "Resubmitted",
]);

/**
 * Heal legacy accounts stuck on « Traitement… » / « Actualiser »:
 * poll Didit, apply terminal outcomes, or reset abandoned / stale sessions.
 */
export async function reconcileUserKycState(userId: string): Promise<boolean> {
  if (!diditApiConfigured()) return false;

  const row = await getUserKycRow(userId);
  if (!row) return false;

  if (row.kycStatus === "approved") return false;

  const sessionId = row.diditSessionId?.trim();
  if (!sessionId) {
    if (row.kycStatus === "pending") {
      await resetUserKycForRetry(userId);
      return true;
    }
    return false;
  }

  if (row.kycStatus !== "pending" && row.kycStatus !== "manual_review") {
    return false;
  }

  const result = await refreshUserKycFromDidit(userId);
  if (result.ok && result.outcome !== "unknown") return true;

  const after = await getUserKycRow(userId);
  if (!after) return false;
  if (after.kycStatus === "approved") return true;

  const dStatus = after.diditSessionStatus?.trim() ?? "";

  if (ABANDONED_STATUSES.has(dStatus)) {
    await resetUserKycForRetry(userId);
    return true;
  }

  if (
    after.kycStatus === "pending" &&
    IN_FLIGHT_STATUSES.has(dStatus) &&
    after.kycUpdatedAt &&
    Date.now() - after.kycUpdatedAt.getTime() > STALE_IN_PROGRESS_MS
  ) {
    await resetUserKycForRetry(userId);
    return true;
  }

  if (
    !result.ok &&
    (result.error.includes("404") || result.error.includes("not_found"))
  ) {
    await resetUserKycForRetry(userId);
    return true;
  }

  return result.ok;
}
