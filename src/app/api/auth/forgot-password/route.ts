import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { createAuthChallenge } from "@/lib/auth/challenges";
import { passwordResetLink, sendAuthEmail } from "@/lib/auth/email";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user) {
    const { rawCode } = await createAuthChallenge({
      userId: user.id,
      purpose: "password_reset",
    });
    const link = passwordResetLink(rawCode);
    await sendAuthEmail({
      to: user.email,
      subject: "McBuleli — réinitialiser votre mot de passe",
      html: `<p>Bonjour,</p><p><a href="${link}">Réinitialiser mon mot de passe</a></p><p>Ce lien expire dans 1 heure.</p>`,
      text: `Réinitialiser : ${link}`,
    });
  }

  return NextResponse.json({
    ok: true,
    message: "If this email exists, a reset link was sent.",
  });
}
