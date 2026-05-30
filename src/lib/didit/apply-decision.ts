import { eq } from "drizzle-orm";
import { getDb, kycResults, users } from "@/db";
import {
  applyKycFromProvider,
  getUserKycRow,
  type KycVerificationOutcome,
} from "@/lib/kyc-service";
import type { KycStatus } from "@/lib/kyc-policy";
import { rejectionNoteFromDiditDecision } from "@/lib/didit/decision-notes";
import {
  extractDiditOcrIdentity,
  ocrToUserPatch,
} from "@/lib/didit/ocr-map";
import {
  getKycSessionRowId,
  syncKycSessionStatus,
} from "@/lib/didit/kyc-session-store";
import { parseDiditSessionStatus } from "@/lib/didit/parse-outcome";

export type ApplyDiditDecisionArgs = {
  userId: string;
  sessionId: string | null;
  diditStatus: string | null;
  resource: Record<string, unknown>;
  source: "webhook" | "api_poll";
};

function outcomeToResultLabel(outcome: KycVerificationOutcome): string {
  if (outcome === "verified") return "approved";
  if (outcome === "reviewNeeded") return "manual_review";
  if (outcome === "rejected") return "rejected";
  if (outcome === "abandoned") return "abandoned";
  return "pending";
}

/** Apply Didit decision: KYC status, OCR enrich users, kyc_results snapshot. */
export async function applyDiditDecision(
  args: ApplyDiditDecisionArgs,
): Promise<KycStatus> {
  const existing = await getUserKycRow(args.userId);
  if (existing?.kycStatus === "approved") {
    return "approved";
  }

  const statusStr = args.diditStatus ?? "";
  const inProgress =
    statusStr === "In Progress" ||
    statusStr === "Not Started" ||
    statusStr === "Resubmitted" ||
    statusStr === "Awaiting User";

  if (inProgress) {
    await syncDiditSessionProgress({
      userId: args.userId,
      sessionId: args.sessionId,
      diditStatus: statusStr,
    });
    return "pending";
  }

  const outcome = parseDiditSessionStatus(statusStr);
  const rejectionNote =
    outcome === "rejected"
      ? rejectionNoteFromDiditDecision(args.resource)
      : null;

  const ocr = extractDiditOcrIdentity(args.resource);
  const ocrPatch = ocr && (outcome === "verified" || outcome === "reviewNeeded")
    ? ocrToUserPatch(ocr)
    : null;

  const kycStatus = await applyKycFromProvider({
    userId: args.userId,
    outcome,
    diditSessionId: args.sessionId,
    diditSessionStatus: statusStr || null,
    rejectionNote,
    ocrPatch,
  });

  if (args.sessionId) {
    const terminal =
      outcome === "verified" ||
      outcome === "rejected" ||
      outcome === "reviewNeeded" ||
      outcome === "abandoned";

    try {
      await syncKycSessionStatus({
        diditSessionId: args.sessionId,
        status: statusStr || kycStatus,
        rawDecision: args.resource,
        completed: terminal,
      });

      if (terminal) {
        const sessionRowId = await getKycSessionRowId(args.sessionId);
        if (sessionRowId) {
          const db = getDb();
          await db.insert(kycResults).values({
            sessionId: sessionRowId,
            userId: args.userId,
            outcome: outcomeToResultLabel(outcome),
            firstName: ocr?.firstName ?? null,
            lastName: ocr?.lastName ?? null,
            birthDate: ocr?.birthDate ?? null,
            documentNumber: ocr?.documentNumber ?? null,
            documentType: ocr?.documentType ?? null,
            documentCountry: ocr?.documentCountry ?? null,
            rejectionReason: rejectionNote,
            source: args.source,
          });
        }
      }
    } catch (err) {
      console.warn("[didit] kyc_sessions/kyc_results sync skipped", err);
    }
  }

  return kycStatus;
}

/** Sync session status only (no terminal outcome). */
export async function syncDiditSessionProgress(args: {
  userId: string;
  sessionId: string | null;
  diditStatus: string;
}): Promise<void> {
  const existing = await getUserKycRow(args.userId);
  if (existing?.kycStatus === "approved") return;

  const db = getDb();
  await db
    .update(users)
    .set({
      kycStatus: "pending",
      kycUpdatedAt: new Date(),
      ...(args.sessionId ? { diditSessionId: args.sessionId } : {}),
      diditSessionStatus: args.diditStatus,
    })
    .where(eq(users.id, args.userId));

  if (args.sessionId) {
    try {
      await syncKycSessionStatus({
        diditSessionId: args.sessionId,
        status: args.diditStatus,
      });
    } catch (err) {
      console.warn("[didit] kyc_sessions progress sync skipped", err);
    }
  }
}
