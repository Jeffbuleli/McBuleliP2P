import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  getUserKycRow,
  resetUserKycForRetry,
  setUserKycPending,
} from "@/lib/kyc-service";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";
import { diditApiConfigured } from "@/lib/didit/api";
import { refreshUserKycFromDidit } from "@/lib/didit/refresh-user-kyc";

const bodyZ = z.object({
  event: z.enum(["started", "finished", "cancelled"]),
  sessionId: z.string().optional(),
  sessionStatus: z.string().optional(),
});

/** Client callback after Didit SDK events — sets pending until webhook confirms. */
export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "kyc_invalid_body" }, { status: 400 });
  }

  const row = await getUserKycRow(userId);
  if (
    row &&
    isKycSanctionsRejection(row.kycRejectionNote) &&
    row.kycStatus === "rejected"
  ) {
    return NextResponse.json({ error: "kyc_sanctions_blocked" }, { status: 403 });
  }

  const { event, sessionId, sessionStatus } = parsed.data;
  const sid = sessionId ?? row?.diditSessionId ?? null;

  if (event === "started") {
    if (row?.kycStatus === "none" || row?.kycStatus === "rejected") {
      await resetUserKycForRetry(userId);
    }
    await setUserKycPending({
      userId,
      diditSessionId: sid,
      diditSessionStatus: sessionStatus ?? "In Progress",
    });
  }

  if (event === "finished" && sid) {
    await setUserKycPending({
      userId,
      diditSessionId: sid,
      diditSessionStatus: sessionStatus ?? "In Review",
    });
    if (diditApiConfigured()) {
      try {
        await refreshUserKycFromDidit(userId);
      } catch (err) {
        console.warn("[kyc/sync] Didit refresh after finish failed", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
