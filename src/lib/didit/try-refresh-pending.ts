import { reconcileUserKycState } from "@/lib/didit/reconcile-stale-kyc";

/** Poll Didit + heal stale pending rows (webhooks missing or legacy accounts). */
export async function tryRefreshKycIfPending(userId: string): Promise<boolean> {
  return reconcileUserKycState(userId);
}
