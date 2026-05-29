import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { consumeAuthChallenge } from "@/lib/auth/challenges";
import { assertEmailAvailable } from "@/lib/auth/email-uniqueness";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const consumed = await consumeAuthChallenge({
    purpose: "email_change",
    rawCode: token,
  });
  if (!consumed?.userId) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const newEmail =
    typeof consumed.meta?.newEmail === "string"
      ? normalizeAuthEmail(consumed.meta.newEmail)
      : null;
  if (!newEmail) {
    return NextResponse.json({ error: "invalid_token_meta" }, { status: 400 });
  }

  const emailCheck = await assertEmailAvailable({
    rawEmail: newEmail,
    excludeUserId: consumed.userId,
  });
  if (!emailCheck.ok) {
    return NextResponse.json(
      {
        error: emailCheck.code,
        ...(emailCheck.suggestedEmail
          ? { suggestedEmail: emailCheck.suggestedEmail }
          : {}),
      },
      { status: 409 },
    );
  }

  const db = getDb();
  await db
    .update(users)
    .set({
      email: emailCheck.email,
      emailCanonical: emailCheck.emailCanonical,
      pendingEmail: null,
      emailVerifiedAt: new Date(),
    })
    .where(eq(users.id, consumed.userId));

  return NextResponse.json({ ok: true, email: emailCheck.email });
}
