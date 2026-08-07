import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  canonicalEmailForDedup,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";
import { sendEmailVerification } from "@/lib/auth/email-verification";
import type { EmailLocale } from "@/lib/email/locale";

export type RdpiSurveyUserResult = {
  id: string;
  email: string;
  created: boolean;
  emailVerified: boolean;
  verificationSent: boolean;
};

/**
 * Ensure a McBuleli user exists for an RDPI respondent.
 * New / unverified → send the same confirmation email as register.
 * Already verified → skip (no double confirmation).
 */
export async function ensureRdpiSurveyUser(args: {
  email: string;
  fullName: string;
  phone: string;
  locale?: EmailLocale;
}): Promise<RdpiSurveyUserResult> {
  const db = getDb();
  const email = normalizeAuthEmail(args.email);
  const canonical = canonicalEmailForDedup(email);

  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      recoveryWaPhone: users.recoveryWaPhone,
    })
    .from(users)
    .where(or(eq(users.email, email), eq(users.emailCanonical, canonical)))
    .limit(1);

  if (existing) {
    if (!existing.recoveryWaPhone && args.phone) {
      await db
        .update(users)
        .set({ recoveryWaPhone: args.phone.slice(0, 32) })
        .where(eq(users.id, existing.id));
    }

    const emailVerified = Boolean(existing.emailVerifiedAt);
    if (emailVerified) {
      return {
        id: existing.id,
        email: existing.email,
        created: false,
        emailVerified: true,
        verificationSent: false,
      };
    }

    let verificationSent = false;
    try {
      await sendEmailVerification(
        existing.id,
        existing.email,
        args.locale ?? "fr",
        {
          returnPath: "/rdpi",
          source: "rdpi_survey",
        },
      );
      verificationSent = true;
    } catch (err) {
      console.warn("[rdpi] verification email failed (existing)", err);
    }

    return {
      id: existing.id,
      email: existing.email,
      created: false,
      emailVerified: false,
      verificationSent,
    };
  }

  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  let displayName = args.fullName.trim().slice(0, 64) || null;
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

  const nameParts = args.fullName.trim().split(/\s+/).filter(Boolean);
  const legalFirstName = (nameParts[0] ?? "").slice(0, 128) || null;
  const legalLastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ").slice(0, 128) : null;

  let created: {
    id: string;
    email: string;
    emailVerifiedAt: Date | null;
  };

  try {
    const [row] = await db
      .insert(users)
      .values({
        email,
        emailCanonical: canonical,
        passwordHash,
        displayName,
        countryCode: "CD",
        legalFirstName,
        legalLastName,
        recoveryWaPhone: args.phone.slice(0, 32) || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
      });
    created = row;
  } catch {
    const [race] = await db
      .select({
        id: users.id,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
      })
      .from(users)
      .where(or(eq(users.email, email), eq(users.emailCanonical, canonical)))
      .limit(1);
    if (!race) throw new Error("rdpi_user_create_failed");
    const emailVerified = Boolean(race.emailVerifiedAt);
    if (emailVerified) {
      return {
        id: race.id,
        email: race.email,
        created: false,
        emailVerified: true,
        verificationSent: false,
      };
    }
    let verificationSent = false;
    try {
      await sendEmailVerification(race.id, race.email, args.locale ?? "fr", {
        returnPath: "/rdpi",
        source: "rdpi_survey",
      });
      verificationSent = true;
    } catch (err) {
      console.warn("[rdpi] verification email failed (race)", err);
    }
    return {
      id: race.id,
      email: race.email,
      created: false,
      emailVerified: false,
      verificationSent,
    };
  }

  let verificationSent = false;
  try {
    await sendEmailVerification(created.id, created.email, args.locale ?? "fr", {
      returnPath: "/rdpi",
      source: "rdpi_survey",
    });
    verificationSent = true;
  } catch (err) {
    console.warn("[rdpi] verification email failed (new)", err);
  }

  void import("@/lib/academy-service")
    .then(({ linkTrainingRegistrationToUser, autoEnrollLaunchCohort }) =>
      linkTrainingRegistrationToUser({
        userId: created.id,
        email: created.email,
      })
        .then(() => autoEnrollLaunchCohort(created.id))
        .catch((err) => console.warn("[rdpi] academy link", err)),
    )
    .catch(() => null);

  return {
    id: created.id,
    email: created.email,
    created: true,
    emailVerified: false,
    verificationSent,
  };
}
