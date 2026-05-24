import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { passkeyLoginOptions, passkeyLoginVerify } from "@/lib/auth/passkeys";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";

const optionsZ = z.object({ email: z.string().email().optional() });

export async function POST(req: Request) {
  const parsed = optionsZ.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { options, challengeId } = await passkeyLoginOptions(parsed.data.email);
  return NextResponse.json({ options, challengeId });
}

const verifyZ = z.object({
  challengeId: z.string().uuid(),
  response: z.unknown(),
});

export async function PUT(req: Request) {
  const parsed = verifyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await passkeyLoginVerify({
    challengeId: parsed.data.challengeId,
    response: parsed.data.response,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, result.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const token = await signSessionToken(user.id, result.sessionVersion);
  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  });
  res.cookies.set(
    sessionCookieName(),
    token,
    getSessionCookieWriteOptions(60 * 60 * 24 * 30),
  );
  return res;
}
