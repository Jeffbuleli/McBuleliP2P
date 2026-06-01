import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb, kycResults, kycSessions, users } from "@/db";
import { getUserKycRow } from "@/lib/kyc-service";
import { tryGrantKycApprovedPoints } from "@/lib/reward-points-service";

async function restoreApproved(userId: string): Promise<boolean> {
  void tryGrantKycApprovedPoints(userId).catch((err) => {
    console.warn("[kyc-restore] reward points grant skipped", err);
  });
  return true;
}

/**
 * Re-approve users whose KYC was wiped by buggy reconcile but proof remains
 * (kyc_results, Didit sessions, or OCR identity from transfer-kyc).
 */
export async function restoreApprovedKycFromHistory(
  userId: string,
): Promise<boolean> {
  const row = await getUserKycRow(userId);
  if (!row || row.kycStatus === "approved") return false;

  const db = getDb();

  const [approvedResult] = await db
    .select({
      sessionId: kycResults.sessionId,
    })
    .from(kycResults)
    .where(
      and(
        eq(kycResults.userId, userId),
        sql`lower(${kycResults.outcome}) in ('approved', 'verified')`,
      ),
    )
    .orderBy(desc(kycResults.decidedAt))
    .limit(1);

  if (approvedResult) {
    const [session] = await db
      .select({
        diditSessionId: kycSessions.diditSessionId,
        status: kycSessions.status,
      })
      .from(kycSessions)
      .where(eq(kycSessions.id, approvedResult.sessionId))
      .limit(1);

    await db
      .update(users)
      .set({
        kycStatus: "approved",
        kycUpdatedAt: new Date(),
        kycRejectionNote: null,
        ...(session?.diditSessionId
          ? {
              diditSessionId: session.diditSessionId,
              diditSessionStatus: session.status ?? "Approved",
            }
          : {}),
      })
      .where(eq(users.id, userId));
    return restoreApproved(userId);
  }

  const [approvedSession] = await db
    .select({
      diditSessionId: kycSessions.diditSessionId,
      status: kycSessions.status,
    })
    .from(kycSessions)
    .where(
      and(
        eq(kycSessions.userId, userId),
        sql`trim(${kycSessions.status}) = 'Approved'`,
        isNotNull(kycSessions.completedAt),
      ),
    )
    .orderBy(desc(kycSessions.completedAt))
    .limit(1);

  if (approvedSession?.diditSessionId) {
    await db
      .update(users)
      .set({
        kycStatus: "approved",
        kycUpdatedAt: new Date(),
        kycRejectionNote: null,
        diditSessionId: approvedSession.diditSessionId,
        diditSessionStatus: approvedSession.status ?? "Approved",
      })
      .where(eq(users.id, userId));
    return restoreApproved(userId);
  }

  const [identity] = await db
    .select({
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      documentNumber: users.documentNumber,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (
    identity?.legalFirstName?.trim() &&
    identity?.legalLastName?.trim() &&
    identity?.documentNumber?.trim()
  ) {
    await db
      .update(users)
      .set({
        kycStatus: "approved",
        kycUpdatedAt: new Date(),
        kycRejectionNote: null,
      })
      .where(eq(users.id, userId));
    return restoreApproved(userId);
  }

  const [completedSession] = await db
    .select({ id: kycSessions.id })
    .from(kycSessions)
    .where(
      and(eq(kycSessions.userId, userId), isNotNull(kycSessions.completedAt)),
    )
    .orderBy(desc(kycSessions.completedAt))
    .limit(1);

  if (
    identity?.legalFirstName?.trim() &&
    identity?.legalLastName?.trim() &&
    completedSession
  ) {
    await db
      .update(users)
      .set({
        kycStatus: "approved",
        kycUpdatedAt: new Date(),
        kycRejectionNote: null,
      })
      .where(eq(users.id, userId));
    return restoreApproved(userId);
  }

  return false;
}
