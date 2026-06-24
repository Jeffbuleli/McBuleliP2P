import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

const CODE_MIN = 4;
const CODE_MAX = 20;
const CODE_RE = /^[A-Za-z0-9]+$/;

export function validateAntiPhishingCode(code: string): boolean {
  const trimmed = code.trim();
  return (
    trimmed.length >= CODE_MIN &&
    trimmed.length <= CODE_MAX &&
    CODE_RE.test(trimmed)
  );
}

export async function isAntiPhishingSet(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ hash: users.antiPhishingCodeHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Boolean(row?.hash);
}

export async function setAntiPhishingCode(
  userId: string,
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!validateAntiPhishingCode(code)) {
    return { ok: false, error: "anti_phishing_invalid" };
  }
  const hash = await bcrypt.hash(code.trim(), 10);
  const db = getDb();
  await db
    .update(users)
    .set({ antiPhishingCodeHash: hash })
    .where(eq(users.id, userId));
  return { ok: true };
}

export async function clearAntiPhishingCode(userId: string): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ antiPhishingCodeHash: null })
    .where(eq(users.id, userId));
}

export async function verifyAntiPhishingCode(
  userId: string,
  code: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ hash: users.antiPhishingCodeHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row?.hash) return false;
  return bcrypt.compare(code.trim(), row.hash);
}
