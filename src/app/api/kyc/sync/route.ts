import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  approveKycFromMetamapDuplicate,
  getUserKycRow,
  resetUserKycForRetry,
  setUserKycPending,
} from "@/lib/kyc-service";
import { isKycSanctionsRejection } from "@/lib/kyc-sanctions";
import { isKycApproved } from "@/lib/kyc-policy";
import { metamapApiConfigured } from "@/lib/metamap/api";
import { refreshUserKycFromMetamap } from "@/lib/metamap/refresh-user-kyc";

const bodyZ = z.object({
  event: z.enum(["started", "finished", "exited", "already_verified"]),
  identityId: z.string().optional(),
  verificationId: z.string().optional(),
});

/** Client callback after MetaMap SDK events — sets pending until webhook confirms. */
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

  const { event, identityId, verificationId } = parsed.data;

  if (event === "already_verified") {
    if (isKycApproved(row?.kycStatus)) {
      return NextResponse.json({ ok: true, status: "approved" });
    }
    const hadAttempt =
      row?.kycStatus === "pending" ||
      row?.kycStatus === "none" ||
      Boolean(row?.metamapIdentityId || row?.metamapVerificationId);
    if (!hadAttempt) {
      return NextResponse.json({ error: "kyc_no_prior_attempt" }, { status: 400 });
    }
    const status = await approveKycFromMetamapDuplicate({
      userId,
      metamapIdentityId: identityId ?? row?.metamapIdentityId ?? null,
      metamapVerificationId: verificationId ?? row?.metamapVerificationId ?? null,
    });
    return NextResponse.json({ ok: true, status });
  }

  if (event === "started") {
    if (row?.kycStatus === "none" || row?.kycStatus === "rejected") {
      await resetUserKycForRetry(userId);
    }
    await setUserKycPending({
      userId,
      metamapIdentityId: identityId ?? null,
      metamapVerificationId: verificationId ?? null,
    });
  }

  if (event === "finished") {
    const vid = verificationId ?? row?.metamapVerificationId ?? null;
    await setUserKycPending({
      userId,
      metamapIdentityId: identityId ?? null,
      metamapVerificationId: vid,
    });
    if (metamapApiConfigured() && vid) {
      try {
        await refreshUserKycFromMetamap(userId);
      } catch (err) {
        console.warn("[kyc/sync] MetaMap refresh after finish failed", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
