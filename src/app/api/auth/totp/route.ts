import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import {
  enableTotpForUser,
  generateBackupCodes,
  generateTotpSecret,
  saveBackupCodes,
  storePendingTotpSecret,
  totpKeyUri,
  verifyTotpCode,
} from "@/lib/auth/totp";
import { assertStepUp } from "@/lib/auth/step-up";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [u] = await db
    .select({ email: users.email, totpEnabledAt: users.totpEnabledAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (u.totpEnabledAt) {
    return NextResponse.json({ error: "totp_already_enabled" }, { status: 409 });
  }

  const secret = generateTotpSecret();
  await storePendingTotpSecret(userId, secret);

  return NextResponse.json({
    ok: true,
    secret,
    uri: totpKeyUri(u.email, secret),
  });
}

const confirmZ = z.object({ code: z.string().min(6).max(12) });

export async function PUT(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = confirmZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ totpSecretEnc: users.totpSecretEnc, totpEnabledAt: users.totpEnabledAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u?.totpSecretEnc) {
    return NextResponse.json({ error: "totp_setup_required" }, { status: 400 });
  }
  if (u.totpEnabledAt) {
    return NextResponse.json({ error: "totp_already_enabled" }, { status: 409 });
  }

  const { getTotpSecretForUser } = await import("@/lib/auth/totp");
  const secret = await getTotpSecretForUser(userId);
  if (!secret || !verifyTotpCode(secret, parsed.data.code)) {
    return NextResponse.json({ error: "totp_invalid" }, { status: 400 });
  }

  await enableTotpForUser(userId);
  const backupCodes = generateBackupCodes();
  await saveBackupCodes(userId, backupCodes);

  return NextResponse.json({ ok: true, backupCodes });
}

const verifyZ = z.object({ code: z.string().min(6).max(16) });

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = verifyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const step = await assertStepUp({ userId, totpCode: parsed.data.code });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = verifyZ.safeParse(await req.json().catch(() => ({})));
  const step = await assertStepUp({
    userId,
    totpCode: body.success ? body.data.code : null,
  });
  if (!step.ok) {
    return NextResponse.json({ error: step.error }, { status: 403 });
  }

  const { disableTotpForUser } = await import("@/lib/auth/totp");
  await disableTotpForUser(userId);
  return NextResponse.json({ ok: true });
}
