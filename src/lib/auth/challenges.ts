import { and, eq, gt, isNull } from "drizzle-orm";
import { authChallenges, getDb } from "@/db";
import { hashToken, randomToken } from "@/lib/auth/crypto";

export type AuthChallengePurpose =
  | "email_verify"
  | "password_reset"
  | "email_change"
  | "wa_verify"
  | "wa_recovery_otp"
  | "totp_setup"
  | "passkey_register"
  | "passkey_login"
  | "passkey_step_up";

const TTL_MINUTES: Record<AuthChallengePurpose, number> = {
  email_verify: 24 * 60,
  password_reset: 15,
  email_change: 60,
  wa_verify: 10,
  wa_recovery_otp: 15,
  totp_setup: 30,
  passkey_register: 5,
  passkey_login: 5,
  passkey_step_up: 5,
};

/** Mark unused challenges as consumed (e.g. invalidate prior password-reset links). */
export async function invalidateActiveAuthChallenges(args: {
  userId: string;
  purpose: AuthChallengePurpose;
}): Promise<void> {
  const db = getDb();
  await db
    .update(authChallenges)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authChallenges.userId, args.userId),
        eq(authChallenges.purpose, args.purpose),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    );
}

export async function createAuthChallenge(args: {
  userId: string | null;
  purpose: AuthChallengePurpose;
  rawCode?: string;
  meta?: Record<string, unknown>;
}): Promise<{ id: string; rawCode: string; expiresAt: Date }> {
  const rawCode = args.rawCode ?? randomToken(24);
  const expiresAt = new Date(
    Date.now() + TTL_MINUTES[args.purpose] * 60 * 1000,
  );
  const db = getDb();
  const [row] = await db
    .insert(authChallenges)
    .values({
      userId: args.userId,
      purpose: args.purpose,
      codeHash: hashToken(rawCode),
      meta: args.meta ?? null,
      expiresAt,
    })
    .returning({ id: authChallenges.id });
  return { id: row!.id, rawCode, expiresAt };
}

export async function consumeAuthChallenge(args: {
  purpose: AuthChallengePurpose;
  rawCode: string;
  userId?: string;
}): Promise<{ id: string; userId: string | null; meta: Record<string, unknown> | null } | null> {
  const db = getDb();
  const codeHash = hashToken(args.rawCode);
  const [row] = await db
    .select()
    .from(authChallenges)
    .where(
      and(
        eq(authChallenges.purpose, args.purpose),
        eq(authChallenges.codeHash, codeHash),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date()),
        args.userId ? eq(authChallenges.userId, args.userId) : undefined,
      ),
    )
    .limit(1);
  if (!row) return null;
  await db
    .update(authChallenges)
    .set({ usedAt: new Date() })
    .where(eq(authChallenges.id, row.id));
  return {
    id: row.id,
    userId: row.userId,
    meta: (row.meta as Record<string, unknown> | null) ?? null,
  };
}

export async function getActiveChallengeById(args: {
  challengeId: string;
  purpose: AuthChallengePurpose;
  userId: string;
}) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(authChallenges)
    .where(
      and(
        eq(authChallenges.id, args.challengeId),
        eq(authChallenges.purpose, args.purpose),
        eq(authChallenges.userId, args.userId),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function markChallengeUsed(challengeId: string): Promise<void> {
  const db = getDb();
  await db
    .update(authChallenges)
    .set({ usedAt: new Date() })
    .where(eq(authChallenges.id, challengeId));
}
