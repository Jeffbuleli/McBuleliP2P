import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { getDb, hackathonRegistrations, users } from "@/db";
import {
  canonicalEmailForDedup,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";

/**
 * Ensure a McBuleli `users` row exists for a hackathon registrant
 * (same DB — no parallel guest identity store).
 */
export async function ensureHackathonUser(args: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<string> {
  const db = getDb();
  const email = normalizeAuthEmail(args.email);
  const canonical = canonicalEmailForDedup(email);

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, email), eq(users.emailCanonical, canonical)))
    .limit(1);
  if (existing) return existing.id;

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  let displayName =
    `${args.firstName} ${args.lastName}`.trim().slice(0, 64) || null;
  if (displayName) {
    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.displayName, displayName))
      .limit(1);
    if (taken) {
      displayName = `${displayName.slice(0, 52)}-${randomBytes(3).toString("hex")}`;
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      emailCanonical: canonical,
      passwordHash,
      displayName,
      countryCode: "CD",
      legalFirstName: args.firstName.slice(0, 128),
      legalLastName: args.lastName.slice(0, 128),
    })
    .returning({ id: users.id });

  return created.id;
}

/** Link unpaid/paid hackathon rows to a user after login/signup (by email). */
export async function linkHackathonRegistrationToUser(args: {
  userId: string;
  email: string;
}): Promise<void> {
  const db = getDb();
  const canonical = canonicalEmailForDedup(normalizeAuthEmail(args.email));
  const regs = await db
    .select({
      id: hackathonRegistrations.id,
      email: hackathonRegistrations.email,
      userId: hackathonRegistrations.userId,
    })
    .from(hackathonRegistrations);

  for (const r of regs) {
    if (r.userId) continue;
    if (canonicalEmailForDedup(normalizeAuthEmail(r.email)) !== canonical) {
      continue;
    }
    await db
      .update(hackathonRegistrations)
      .set({ userId: args.userId, updatedAt: new Date() })
      .where(eq(hackathonRegistrations.id, r.id));
  }
}
