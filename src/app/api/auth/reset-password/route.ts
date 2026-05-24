import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { consumeAuthChallenge } from "@/lib/auth/challenges";
import { bumpSessionVersion } from "@/lib/auth/step-up";
import { sessionCookieName, signSessionToken } from "@/lib/jwt";
import { getSessionCookieWriteOptions } from "@/lib/session-cookie";

const bodyZ = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const consumed = await consumeAuthChallenge({
    purpose: "password_reset",
    rawCode: parsed.data.token,
  });
  if (!consumed?.userId) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const sessionVersion = await bumpSessionVersion(consumed.userId);
  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, consumed.userId));

  const token = await signSessionToken(consumed.userId, sessionVersion);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    sessionCookieName(),
    token,
    getSessionCookieWriteOptions(60 * 60 * 24 * 30),
  );
  return res;
}
