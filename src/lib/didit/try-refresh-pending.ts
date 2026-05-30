import { getUserKycRow } from "@/lib/kyc-service";
import { reconcileUserKycState } from "@/lib/didit/reconcile-stale-kyc";

/** Poll Didit + heal stale pending rows (webhooks missing or legacy accounts). */
export async function tryRefreshKycIfPending(userId: string): Promise<boolean> {
  const row = await getUserKycRow(userId);
  if (!row) return false;
  if (row.kycStatus !== "pending" && row.kycStatus !== "manual_review") {
    return false;
  }
  return reconcileUserKycState(userId);
}
