import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { createAuthChallenge } from "@/lib/auth/challenges";
import { generateWaVerifyCode, pickWaMessageTemplate } from "@/lib/auth/crypto";
import { getOpenWaMcBuleliPhone } from "@/lib/auth/openwa-client";
import { getActiveChallengeById } from "@/lib/auth/challenges";

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const code = generateWaVerifyCode();
  const { id, expiresAt } = await createAuthChallenge({
    userId,
    purpose: "wa_verify",
    rawCode: code,
  });

  const templateIndex = Math.floor(Math.random() * 3);
  const message = pickWaMessageTemplate(code, templateIndex);
  const waNumber = await getOpenWaMcBuleliPhone();

  return NextResponse.json({
    ok: true,
    challengeId: id,
    code,
    message,
    waNumber,
    waLink: waNumber ? `https://wa.me/${waNumber.replace(/\D/g, "")}` : null,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const challengeId = new URL(req.url).searchParams.get("challengeId")?.trim();
  if (!challengeId) {
    return NextResponse.json({ error: "missing_challenge" }, { status: 400 });
  }

  const row = await getActiveChallengeById({
    challengeId,
    purpose: "wa_verify",
    userId,
  });

  if (!row) {
    const { getSecurityStatus } = await import("@/lib/auth/security-status");
    const status = await getSecurityStatus(userId);
    if (status?.whatsAppVerified) {
      return NextResponse.json({ ok: true, verified: true });
    }
    return NextResponse.json({ ok: true, verified: false, expired: true });
  }

  const { getDb, users } = await import("@/db");
  const { eq } = await import("drizzle-orm");
  const db = getDb();
  const [u] = await db
    .select({ waVerifiedAt: users.waVerifiedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const verified = Boolean(u?.waVerifiedAt);
  if (verified && row.usedAt) {
    return NextResponse.json({ ok: true, verified: true });
  }

  return NextResponse.json({
    ok: true,
    verified,
    pending: !verified,
  });
}
