import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups } from "@/db";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGroupInviteCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += CODE_CHARS[bytes[i]! % CODE_CHARS.length];
  }
  return out;
}

export async function ensureGroupInviteCode(groupId: string): Promise<string | null> {
  const db = getDb();
  const [g] = await db
    .select({ inviteCode: groupSavingsGroups.inviteCode, status: groupSavingsGroups.status })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  if (!g || (g.status !== "active" && g.status !== "approved")) return null;
  if (g.inviteCode) return g.inviteCode;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateGroupInviteCode();
    try {
      await db
        .update(groupSavingsGroups)
        .set({ inviteCode: code, updatedAt: new Date() })
        .where(eq(groupSavingsGroups.id, groupId));
      return code;
    } catch {
      /* unique collision */
    }
  }
  return null;
}

export async function findGroupIdByInviteCode(code: string): Promise<string | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized || normalized.length < 6) return null;
  const db = getDb();
  const [g] = await db
    .select({ id: groupSavingsGroups.id, status: groupSavingsGroups.status })
    .from(groupSavingsGroups)
    .where(eq(groupSavingsGroups.inviteCode, normalized))
    .limit(1);
  if (!g) return null;
  if (g.status !== "active" && g.status !== "approved") return null;
  return g.id;
}
