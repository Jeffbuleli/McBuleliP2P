import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { consumeAuthChallenge } from "@/lib/auth/challenges";

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
      ? consumed.meta.newEmail.trim().toLowerCase()
      : null;
  if (!newEmail) {
    return NextResponse.json({ error: "invalid_token_meta" }, { status: 400 });
  }

  const db = getDb();
  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);
  if (dup && dup.id !== consumed.userId) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  await db
    .update(users)
    .set({
      email: newEmail,
      pendingEmail: null,
      emailVerifiedAt: new Date(),
    })
    .where(eq(users.id, consumed.userId));

  return NextResponse.json({ ok: true, email: newEmail });
}
