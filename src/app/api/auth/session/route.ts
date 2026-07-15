import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { sessionCookieName, signSessionToken, verifySessionTokenFull } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";
import { sessionMaxAgeSeconds } from "@/lib/session-config";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Session probe / sliding refresh.
 * Always HTTP 200: { ok: false } when logged out (avoids noisy 401 in `next dev`).
 * Authenticated: { ok: true, user } + refreshed cookie.
 */
export async function GET() {
  const jar = await cookies();
  const raw = jar.get(sessionCookieName())?.value;
  if (!raw) {
    return NextResponse.json({ ok: false });
  }

  let userId: string;
  let sessionVersion: number;
  try {
    const verified = await verifySessionTokenFull(raw);
    userId = verified.userId;
    sessionVersion = verified.sessionVersion;
  } catch {
    return NextResponse.json({ ok: false });
  }

  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      sessionVersion: users.sessionVersion,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.sessionVersion !== sessionVersion) {
    return NextResponse.json({ ok: false });
  }

  const { userNeedsEmailVerification } = await import(
    "@/lib/auth/email-verified-gate"
  );
  const emailVerified = !userNeedsEmailVerification({
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
  });

  const token = await signSessionToken(user.id, user.sessionVersion);
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified,
    },
  });
  res.cookies.set(
    sessionCookieName(),
    token,
    getSessionCookieWriteOptions(sessionMaxAgeSeconds()),
  );

  const { reconcileUserRewardPoints } = await import("@/lib/reward-points-service");
  void reconcileUserRewardPoints(user.id).catch((err) => {
    console.warn("[auth/session] reward points reconcile", err);
  });

  return res;
}
