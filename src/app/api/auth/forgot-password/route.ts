import { NextResponse } from "next/server";
import { findUserByAuthEmail } from "@/lib/auth/email-uniqueness";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";
import { sendPasswordResetEmail } from "@/lib/email/messages/password-reset";
import { resolveEmailLocale } from "@/lib/email/locale";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email ? normalizeAuthEmail(body.email) : "";
  if (!email) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const locale = await resolveEmailLocale(req);
  const user = await findUserByAuthEmail(email);

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
