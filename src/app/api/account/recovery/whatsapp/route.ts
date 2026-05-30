import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { createAuthChallenge } from "@/lib/auth/challenges";
import { randomDigits } from "@/lib/auth/crypto";
import { sendWhatsAppOtp } from "@/lib/auth/whatsapp";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ ok: true, message: "If eligible, a code was sent." });
  }

  const db = getDb();
  const [user] = await db
    .select({
      id: users.id,
      recoveryWaChatId: users.recoveryWaChatId,
      waVerifiedAt: users.waVerifiedAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user?.waVerifiedAt && user.recoveryWaChatId) {
    const otp = randomDigits(6);
    await createAuthChallenge({
      userId: user.id,
      purpose: "wa_recovery_otp",
      rawCode: otp,
    });
    await sendWhatsAppOtp({ chatId: user.recoveryWaChatId, otp });
  }

  return NextResponse.json({
    ok: true,
    message: "If eligible, a code was sent.",
  });
}

const verifyZ = z.object({
  email: z.string().email(),
  otp: z.string().min(4).max(12),
  newPassword: z.string().min(8).max(128),
});

export async function PUT(req: Request) {
  const parsed = verifyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const db = getDb();
  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const { consumeAuthChallenge } = await import("@/lib/auth/challenges");
  const consumed = await consumeAuthChallenge({
    purpose: "wa_recovery_otp",
    rawCode: parsed.data.otp.trim(),
    userId: user.id,
  });
  if (!consumed) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const bcrypt = (await import("bcryptjs")).default;
  const { bumpSessionVersion } = await import("@/lib/auth/step-up");
  const { sessionCookieName, signSessionToken } = await import("@/lib/jwt");
  const { getSessionCookieWriteOptions } = await import("@/lib/session-cookie");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const sessionVersion = await bumpSessionVersion(user.id);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, user.id));

  const token = await signSessionToken(user.id, sessionVersion);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    sessionCookieName(),
    token,
    getSessionCookieWriteOptions(),
  );
  return res;
}
