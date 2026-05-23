import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createDiditSession, diditApiConfigured } from "@/lib/didit/api";
import { setUserKycPending } from "@/lib/kyc-service";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Create a Didit KYC session and return the hosted verification URL. */
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!diditApiConfigured()) {
    return NextResponse.json({ error: "didit_not_configured" }, { status: 503 });
  }

  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  try {
    const session = await createDiditSession({
      userId,
      countryCode: u?.countryCode,
    });
    const sessionId =
      typeof session.session_id === "string" ? session.session_id : null;
    const url = typeof session.url === "string" ? session.url : null;
    if (!url) {
      return NextResponse.json({ error: "didit_no_url" }, { status: 502 });
    }

    await setUserKycPending({
      userId,
      diditSessionId: sessionId,
    });

    return NextResponse.json({
      ok: true,
      sessionId,
      url,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "didit_create_failed";
    console.warn("[kyc/session] create failed", userId, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
