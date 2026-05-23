import { getUserKycRow } from "@/lib/kyc-service";
import { diditApiConfigured } from "@/lib/didit/api";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";

/** Poll Didit when user is still pending (webhooks missing or delayed). */
export async function tryRefreshKycIfPending(userId: string): Promise<boolean> {
  if (!diditApiConfigured()) return false;

  const row = await getUserKycRow(userId);
  if (!row?.diditSessionId?.trim()) return false;

  const status = row.kycStatus;
  if (status !== "pending" && status !== "manual_review") return false;

  const result = await refreshUserKycFromDidit(userId);
  if (!result.ok) {
    console.warn("[kyc] auto-refresh pending failed", userId, result.error);
    return false;
  }
  return true;
}
