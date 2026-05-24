import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { assertStepUp, bumpSessionVersion } from "@/lib/auth/step-up";
import { isPiSyntheticEmail } from "@/lib/auth/security-status";

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
    .select({ passwordHash: users.passwordHash })
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

  const newEmail = parsed.data.newEmail.trim().toLowerCase();
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

  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, newEmail))
    .limit(1);
  if (dup) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const { createAuthChallenge } = await import("@/lib/auth/challenges");
  const { emailChangeLink, sendAuthEmail } = await import("@/lib/auth/email");

  await db
    .update(users)
    .set({ pendingEmail: newEmail })
    .where(eq(users.id, userId));

  const { rawCode } = await createAuthChallenge({
    userId,
    purpose: "email_change",
    meta: { newEmail },
  });

  await sendAuthEmail({
    to: newEmail,
    subject: "McBuleli — confirmer votre nouvel email",
    html: `<p><a href="${emailChangeLink(rawCode)}">Confirmer ${newEmail}</a></p>`,
    text: emailChangeLink(rawCode),
  });

  return NextResponse.json({ ok: true, pendingEmail: newEmail });
}
