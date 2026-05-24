import { getUserKycRow, type KycVerificationOutcome } from "@/lib/kyc-service";
import type { KycStatus } from "@/lib/kyc-policy";
import {
  diditApiConfigured,
  fetchDiditSessionDecision,
} from "@/lib/didit/api";
import { applyDiditDecision } from "@/lib/didit/apply-decision";
import { parseDiditSessionStatus } from "@/lib/didit/parse-outcome";

export type RefreshUserKycResult =
  | { ok: true; status: KycStatus; outcome: KycVerificationOutcome }
  | { ok: false; error: string };

/** Pull latest Didit session decision into McBuleli (status + OCR). */
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

  let body: Record<string, unknown>;
  try {
    body = (await fetchDiditSessionDecision(sessionId)) as Record<string, unknown>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "didit_fetch_failed";
    return { ok: false, error: msg };
  }

  const diditStatus = typeof body.status === "string" ? body.status : null;
  const status = await applyDiditDecision({
    userId,
    sessionId,
    diditStatus,
    resource: body,
    source: "api_poll",
  });

  const outcome = parseDiditSessionStatus(diditStatus);
  return { ok: true, status, outcome };
}
