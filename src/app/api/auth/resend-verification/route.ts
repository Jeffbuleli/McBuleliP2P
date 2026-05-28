import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { sendEmailVerification } from "@/lib/auth/email-verification";
import { resolveEmailLocale } from "@/lib/email/locale";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locale = await resolveEmailLocale(req);
  const db = getDb();
  const [u] = await db
    .select({ email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (u.emailVerifiedAt) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  await sendEmailVerification(userId, u.email, locale);
  return NextResponse.json({ ok: true });
}
