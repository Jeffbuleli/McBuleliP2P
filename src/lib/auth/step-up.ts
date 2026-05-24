import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { verifyUserTotpOrBackup } from "@/lib/auth/totp";

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

export async function setStepUpVerified(userId: string): Promise<void> {
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
  const jar = await cookies();
  const raw = jar.get(STEP_UP_COOKIE)?.value;
  if (!raw) return false;
  const [uid, tsStr] = raw.split(":");
  if (uid !== userId) return false;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < STEP_UP_MS;
}

/** Require TOTP (or backup) unless step-up cookie is fresh. */
export async function assertStepUp(args: {
  userId: string;
  totpCode?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const enabled = await isTotpEnabled(args.userId);
  if (!enabled) return { ok: true };
  if (await hasRecentStepUp(args.userId)) return { ok: true };
  const code = args.totpCode?.trim();
  if (!code) return { ok: false, error: "totp_required" };
  const valid = await verifyUserTotpOrBackup(args.userId, code);
  if (!valid) return { ok: false, error: "totp_invalid" };
  await setStepUpVerified(args.userId);
  return { ok: true };
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
