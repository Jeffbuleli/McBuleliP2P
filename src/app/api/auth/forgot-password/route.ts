import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { sendPasswordResetEmail } from "@/lib/email/messages/password-reset";
import { resolveEmailLocale } from "@/lib/email/locale";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const locale = await resolveEmailLocale(req);
  const db = getDb();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    await sendPasswordResetEmail({
      userId: user.id,
      email: user.email,
      locale,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "If this email exists, a reset link was sent.",
  });
}
