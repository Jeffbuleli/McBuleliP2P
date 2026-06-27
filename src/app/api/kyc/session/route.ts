import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import {
  createDiditSession,
  diditApiConfigured,
  fetchDiditSession,
} from "@/lib/didit/api";
import { setUserKycPending } from "@/lib/kyc-service";
import {
  getStoredVerificationUrl,
  isDiditSessionResumable,
  recordKycSessionCreated,
} from "@/lib/didit/kyc-session-store";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { kycEligibleCountry, kycEnabled } from "@/lib/kyc-policy";

export const dynamic = "force-dynamic";

/** Create or resume a Didit KYC session; return SDK url only when session is READY. */
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!diditApiConfigured()) {
    return NextResponse.json({ error: "didit_not_configured" }, { status: 503 });
  }
  if (!kycEnabled()) {
    return NextResponse.json({ error: "kyc_disabled" }, { status: 503 });
  }

  const db = getDb();
  const [u] = await db
    .select({
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
      diditSessionId: users.diditSessionId,
      diditSessionStatus: users.diditSessionStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!kycEligibleCountry(u?.countryCode)) {
    return NextResponse.json({ error: "kyc_country_unsupported" }, { status: 400 });
  }

  const existingId = u?.diditSessionId?.trim();
  if (
    existingId &&
    u?.kycStatus === "pending" &&
    isDiditSessionResumable(u.diditSessionStatus)
  ) {
    let url = await getStoredVerificationUrl(existingId);
    if (!url) {
      try {
        const existing = await fetchDiditSession(existingId);
        url = typeof existing.url === "string" ? existing.url : null;
      } catch (err) {
        console.warn("[kyc/session] resume fetch failed", existingId, err);
      }
    }
    if (url) {
      return NextResponse.json({
        ok: true,
        sessionId: existingId,
        url,
        resumed: true,
      });
    }
  }

  try {
    const session = await createDiditSession({
      userId,
      countryCode: u?.countryCode,
    });
    const sessionId =
      typeof session.session_id === "string" ? session.session_id : null;
    const url = typeof session.url === "string" ? session.url : null;
    if (!url || !sessionId) {
      return NextResponse.json({ error: "didit_no_url" }, { status: 502 });
    }

    const sessionStatus =
      typeof session.status === "string" ? session.status : "Not Started";

    try {
      await recordKycSessionCreated({
        userId,
        diditSessionId: sessionId,
        status: sessionStatus,
        verificationUrl: url,
      });
    } catch (err) {
      console.warn("[kyc/session] kyc_sessions insert skipped", err);
    }

    await setUserKycPending({
      userId,
      diditSessionId: sessionId,
      diditSessionStatus: sessionStatus,
    });

    return NextResponse.json({
      ok: true,
      sessionId,
      url,
      resumed: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "didit_create_failed";
    console.warn("[kyc/session] create failed", userId, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
