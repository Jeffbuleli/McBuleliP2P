import { generateSecret, generateURI, verifySync } from "otplib";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, userTotpBackupCodes, users } from "@/db";
import {
  decryptSecret,
  encryptSecret,
  hashToken,
  randomDigits,
} from "@/lib/auth/crypto";

export function generateTotpSecret(): string {
  return generateSecret();
}

export function totpKeyUri(email: string, secret: string): string {
  return generateURI({
    issuer: "McBuleli",
    label: email,
    secret,
  });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const c = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const result = verifySync({
    secret,
    token: c,
    epochTolerance: 30,
  });
  return result.valid;
}

export async function storePendingTotpSecret(
  userId: string,
  secret: string,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ totpSecretEnc: encryptSecret(secret) })
    .where(eq(users.id, userId));
}

export async function enableTotpForUser(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ totpEnabledAt: new Date() })
    .where(eq(users.id, userId));
}

export async function disableTotpForUser(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ totpSecretEnc: null, totpEnabledAt: null })
    .where(eq(users.id, userId));
  await db
    .delete(userTotpBackupCodes)
    .where(eq(userTotpBackupCodes.userId, userId));
}

export async function getTotpSecretForUser(
  userId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ enc: users.totpSecretEnc })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.enc) return null;
  try {
    return decryptSecret(row.enc);
  } catch {
    return null;
  }
}

export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    `${randomDigits(4)}-${randomDigits(4)}`.toUpperCase(),
  );
}

export async function saveBackupCodes(
  userId: string,
  codes: string[],
): Promise<void> {
  const db = getDb();
  await db
    .delete(userTotpBackupCodes)
    .where(eq(userTotpBackupCodes.userId, userId));
  if (codes.length) {
    await db.insert(userTotpBackupCodes).values(
      codes.map((c) => ({
        userId,
        codeHash: hashToken(c.replace(/\s/g, "").toUpperCase()),
      })),
    );
  }
}

export async function consumeBackupCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const db = getDb();
  const normalized = code.replace(/\s/g, "").toUpperCase();
  const codeHash = hashToken(normalized);
  const [row] = await db
    .select({ id: userTotpBackupCodes.id })
    .from(userTotpBackupCodes)
    .where(
      and(
        eq(userTotpBackupCodes.userId, userId),
        eq(userTotpBackupCodes.codeHash, codeHash),
        isNull(userTotpBackupCodes.usedAt),
      ),
    )
    .limit(1);
  if (!row) return false;
  await db
    .update(userTotpBackupCodes)
    .set({ usedAt: new Date() })
    .where(eq(userTotpBackupCodes.id, row.id));
  return true;
}

export async function verifyUserTotpOrBackup(
  userId: string,
  code: string,
): Promise<boolean> {
  const secret = await getTotpSecretForUser(userId);
  if (secret && verifyTotpCode(secret, code)) return true;
  return consumeBackupCode(userId, code);
}
