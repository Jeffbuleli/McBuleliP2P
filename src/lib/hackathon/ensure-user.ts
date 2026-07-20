import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, or } from "drizzle-orm";
import { getDb, hackathonRegistrations, users } from "@/db";
import {
  canonicalEmailForDedup,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";
import {
  generatePaymentToken,
  payLaterPublicUrl,
} from "@/lib/hackathon/service";
import { sendHackathonReserveEmail } from "@/lib/email/messages/hackathon";

export type HackathonUserRef = {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  created: boolean;
};

/**
 * Ensure a McBuleli `users` row exists for a hackathon registrant
 * (same DB — no parallel guest identity store).
 * Always keyed by the registration email (never attach another person's email to a session user).
 */
export async function ensureHackathonUser(args: {
  email: string;
  firstName: string;
  lastName: string;
}): Promise<HackathonUserRef> {
  const db = getDb();
  const email = normalizeAuthEmail(args.email);
  const canonical = canonicalEmailForDedup(email);

  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(or(eq(users.email, email), eq(users.emailCanonical, canonical)))
    .limit(1);
  if (existing) {
    return {
      id: existing.id,
      email: existing.email,
      emailVerifiedAt: existing.emailVerifiedAt,
      created: false,
    };
  }

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
    .returning({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    });

  return {
    id: created.id,
    email: created.email,
    emailVerifiedAt: created.emailVerifiedAt,
    created: true,
  };
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
    if (r.userId && r.userId !== args.userId) continue;
    if (canonicalEmailForDedup(normalizeAuthEmail(r.email)) !== canonical) {
      continue;
    }
    if (r.userId === args.userId) continue;
    await db
      .update(hackathonRegistrations)
      .set({ userId: args.userId, updatedAt: new Date() })
      .where(eq(hackathonRegistrations.id, r.id));
  }
}

/**
 * After email verify: promote `pending_verify` registrations to `reserved`
 * and send the pay-later / reservation email.
 */
export async function activateHackathonAfterEmailVerify(args: {
  userId: string;
  registrationId?: string;
}): Promise<{
  activated: boolean;
  payUrl?: string;
  registrationId?: string;
}> {
  const db = getDb();

  let pending =
    args.registrationId
      ? await db
          .select()
          .from(hackathonRegistrations)
          .where(
            and(
              eq(hackathonRegistrations.id, args.registrationId),
              eq(hackathonRegistrations.userId, args.userId),
              eq(hackathonRegistrations.paymentStatus, "pending_verify"),
            ),
          )
          .limit(1)
      : [];

  if (!pending[0]) {
    pending = await db
      .select()
      .from(hackathonRegistrations)
      .where(
        and(
          eq(hackathonRegistrations.userId, args.userId),
          eq(hackathonRegistrations.paymentStatus, "pending_verify"),
        ),
      )
      .orderBy(desc(hackathonRegistrations.updatedAt))
      .limit(1);
  }

  const reg = pending[0];
  if (!reg) {
    return { activated: false };
  }

  const token = generatePaymentToken();

  await db
    .update(hackathonRegistrations)
    .set({
      paymentStatus: "reserved",
      paymentToken: token,
      holdExpiresAt: null,
      holdReminderSentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(hackathonRegistrations.id, reg.id));

  void sendHackathonReserveEmail({ registrationId: reg.id }).catch(() => null);

  return {
    activated: true,
    registrationId: reg.id,
    payUrl: payLaterPublicUrl(token),
  };
}
