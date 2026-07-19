import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { consumeAuthChallenge } from "@/lib/auth/challenges";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const consumed = await consumeAuthChallenge({
    purpose: "email_verify",
    rawCode: token,
  });
  if (!consumed?.userId) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, consumed.userId))
    .limit(1);

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, consumed.userId));

  const { tryGrantEmailVerifiedPoints } = await import(
    "@/lib/reward-points-service"
  );
  void tryGrantEmailVerifiedPoints(consumed.userId).catch((err) => {
    console.warn("[auth/verify-email] reward points grant skipped", err);
  });

  const hackathonRegistrationId =
    typeof consumed.meta?.hackathonRegistrationId === "string"
      ? consumed.meta.hackathonRegistrationId
      : undefined;

  const { activateHackathonAfterEmailVerify } = await import(
    "@/lib/hackathon/ensure-user"
  );
  const hackathon = await activateHackathonAfterEmailVerify({
    userId: consumed.userId,
    registrationId: hackathonRegistrationId,
  }).catch((err) => {
    console.warn("[auth/verify-email] hackathon activate failed", err);
    return { activated: false as const };
  });

  const jwt = await signSessionToken(consumed.userId, u?.sessionVersion ?? 0);
  const res = NextResponse.json({
    ok: true,
    next: hackathon.activated
      ? hackathon.payUrl ?? "/hackathon#register"
      : "/app",
    hackathonActivated: hackathon.activated,
  });
  res.cookies.set(
    sessionCookieName(),
    jwt,
    getSessionCookieWriteOptions(),
  );
  return res;
}
