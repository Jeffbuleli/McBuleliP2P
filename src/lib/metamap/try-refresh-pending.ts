import { getUserKycRow } from "@/lib/kyc-service";
import { metamapApiConfigured } from "@/lib/metamap/api";
import { refreshUserKycFromMetamap } from "@/lib/metamap/refresh-user-kyc";

/** Poll MetaMap when user is still pending (webhooks missing or delayed). */
export async function tryRefreshKycIfPending(userId: string): Promise<boolean> {
  if (!metamapApiConfigured()) return false;

  const row = await getUserKycRow(userId);
  if (!row?.metamapVerificationId?.trim()) return false;

  const status = row.kycStatus;
  if (status !== "pending" && status !== "manual_review") return false;

  const result = await refreshUserKycFromMetamap(userId);
  if (!result.ok) {
    console.warn("[kyc] auto-refresh pending failed", userId, result.error);
    return false;
  }
  return true;
}
