import {
  applyKycFromProvider,
  getUserKycRow,
  type KycVerificationOutcome,
} from "@/lib/kyc-service";
import type { KycStatus } from "@/lib/kyc-policy";
import {
  diditApiConfigured,
  fetchDiditSessionDecision,
  outcomeFromDiditResource,
  rejectionNoteFromDiditResource,
} from "@/lib/didit/api";

export type RefreshUserKycResult =
  | { ok: true; status: KycStatus; outcome: KycVerificationOutcome }
  | { ok: false; error: string };

/** Pull latest Didit session decision into McBuleli. */
export async function refreshUserKycFromDidit(
  userId: string,
): Promise<RefreshUserKycResult> {
  if (!diditApiConfigured()) {
    return { ok: false, error: "didit_api_not_configured" };
  }

  const row = await getUserKycRow(userId);
  const sessionId = row?.diditSessionId?.trim();
  if (!sessionId) {
    return { ok: false, error: "no_session_id" };
  }

  let body;
  try {
    body = await fetchDiditSessionDecision(sessionId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "didit_fetch_failed";
    return { ok: false, error: msg };
  }

  const outcome = outcomeFromDiditResource(body);
  const diditStatus =
    typeof body.status === "string" ? body.status : null;

  const status = await applyKycFromProvider({
    userId,
    outcome,
    diditSessionId: sessionId,
    diditSessionStatus: diditStatus,
    rejectionNote: rejectionNoteFromDiditResource(body, outcome),
  });

  return { ok: true, status, outcome };
}
