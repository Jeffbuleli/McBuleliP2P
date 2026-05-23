import {
  applyKycFromMetamap,
  getUserKycRow,
  type MetamapVerificationOutcome,
} from "@/lib/kyc-service";
import type { KycStatus } from "@/lib/kyc-policy";
import {
  fetchMetamapVerification,
  metamapApiConfigured,
  outcomeFromMetamapResource,
  rejectionNoteFromMetamapResource,
} from "@/lib/metamap/api";

export type RefreshUserKycResult =
  | { ok: true; status: KycStatus; outcome: MetamapVerificationOutcome }
  | { ok: false; error: string };

/** Pull latest MetaMap verification status into McBuleli (when webhooks are missing). */
export async function refreshUserKycFromMetamap(
  userId: string,
): Promise<RefreshUserKycResult> {
  if (!metamapApiConfigured()) {
    return { ok: false, error: "metamap_api_not_configured" };
  }

  const row = await getUserKycRow(userId);
  const verificationId = row?.metamapVerificationId?.trim();
  if (!verificationId) {
    return { ok: false, error: "no_verification_id" };
  }

  let body;
  try {
    body = await fetchMetamapVerification(verificationId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "metamap_fetch_failed";
    return { ok: false, error: msg };
  }

  const outcome = outcomeFromMetamapResource(body);
  const status = await applyKycFromMetamap({
    userId,
    outcome,
    metamapVerificationId: verificationId,
    rejectionNote: rejectionNoteFromMetamapResource(body, outcome),
  });

  return { ok: true, status, outcome };
}
