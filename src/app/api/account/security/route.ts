import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { assertStepUp, bumpSessionVersion } from "@/lib/auth/step-up";
import { assertEmailAvailable } from "@/lib/auth/email-uniqueness";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";
import { isPiSyntheticEmail } from "@/lib/auth/security-status";
import { sendPasswordChangedEmail } from "@/lib/email/messages/password-changed";
import {
  sendEmailChangeAlert,
  sendEmailChangeConfirm,
} from "@/lib/email/messages/email-change";
import { resolveEmailLocale } from "@/lib/email/locale";

const bodyZ = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
  totpCode: z.string().optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const step = await assertStepUp({
    userId,
    totpCode: parsed.data.totpCode ?? null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !(await bcrypt.compare(parsed.data.currentPassword, u.passwordHash))) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await bumpSessionVersion(userId);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));

  const locale = await resolveEmailLocale(req);
  void sendPasswordChangedEmail({ email: u.email, locale }).catch((err) => {
    console.warn("[account/security] password-changed email failed", err);
  });

  return NextResponse.json({ ok: true });
}

const emailZ = z.object({
  newEmail: z.string().email().max(255),
  currentPassword: z.string().min(8).max(128),
  totpCode: z.string().optional(),
});

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = emailZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const newEmail = normalizeAuthEmail(parsed.data.newEmail);
  if (isPiSyntheticEmail(newEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const step = await assertStepUp({
    userId,
    totpCode: parsed.data.totpCode ?? null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  const db = getDb();
  const [u] = await db
    .select({ passwordHash: users.passwordHash, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u || !(await bcrypt.compare(parsed.data.currentPassword, u.passwordHash))) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const emailCheck = await assertEmailAvailable({
    rawEmail: newEmail,
    excludeUserId: userId,
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

  await db
    .update(users)
    .set({ pendingEmail: emailCheck.email })
    .where(eq(users.id, userId));

  const locale = await resolveEmailLocale(req);

  await sendEmailChangeConfirm({
    userId,
    newEmail: emailCheck.email,
    locale,
  });

  void sendEmailChangeAlert({
    currentEmail: u.email,
    newEmail: emailCheck.email,
    locale,
  }).catch((err) => {
    console.warn("[account/security] email-change alert failed", err);
  });

  return NextResponse.json({ ok: true, pendingEmail: emailCheck.email });
}
