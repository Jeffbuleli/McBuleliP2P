import { eq } from "drizzle-orm";
import { getDb, userPasskeys, users } from "@/db";
import { verifyUserTotpOrBackup } from "@/lib/auth/totp";
import { passkeyStepUpVerify } from "@/lib/auth/passkeys";

const STEP_UP_COOKIE = "mcbuleli_step_up";
const STEP_UP_MS = 10 * 60 * 1000;

export async function isTotpEnabled(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ at: users.totpEnabledAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(row?.at);
}

export async function hasPasskeys(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: userPasskeys.id })
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, userId))
    .limit(1);
  return Boolean(row);
}

export async function userNeedsStepUp(userId: string): Promise<boolean> {
  const [totp, passkeys] = await Promise.all([
    isTotpEnabled(userId),
    hasPasskeys(userId),
  ]);
  return totp || passkeys;
}

export async function setStepUpVerified(userId: string): Promise<void> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  jar.set(STEP_UP_COOKIE, `${userId}:${Date.now()}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STEP_UP_MS / 1000,
  });
}

export async function hasRecentStepUp(userId: string): Promise<boolean> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const raw = jar.get(STEP_UP_COOKIE)?.value;
  if (!raw) return false;
  const [uid, tsStr] = raw.split(":");
  if (uid !== userId) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < STEP_UP_MS;
}

/** Require TOTP, passkey, or backup unless step-up cookie is fresh. */
export async function assertStepUp(args: {
  userId: string;
  totpCode?: string | null;
  passkeyChallengeId?: string | null;
  passkeyResponse?: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const needs = await userNeedsStepUp(args.userId);
  if (!needs) return { ok: true };
  if (await hasRecentStepUp(args.userId)) return { ok: true };

  if (args.passkeyChallengeId && args.passkeyResponse) {
    const pk = await passkeyStepUpVerify({
      userId: args.userId,
      challengeId: args.passkeyChallengeId,
      response: args.passkeyResponse,
    });
    if (!pk.ok) return pk;
    await setStepUpVerified(args.userId);
    return { ok: true };
  }

  const code = args.totpCode?.trim();
  if (code) {
    const valid = await verifyUserTotpOrBackup(args.userId, code);
    if (!valid) return { ok: false, error: "totp_invalid" };
    await setStepUpVerified(args.userId);
    return { ok: true };
  }

  return { ok: false, error: "step_up_required" };
}

export async function bumpSessionVersion(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ v: users.sessionVersion })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const next = (row?.v ?? 0) + 1;
  await db
    .update(users)
    .set({ sessionVersion: next })
    .where(eq(users.id, userId));
  return next;
}
