import { and, eq, ne, or, sql } from "drizzle-orm";
import { getDb, users } from "@/db";
import {
  canonicalEmailForDedup,
  domainsAreSuspiciouslySimilar,
  fixKnownEmailDomainTypo,
  isRetiredOrSystemEmail,
  normalizeAuthEmail,
  suggestEmailTypoFix,
} from "@/lib/auth/email-normalize";

export type EmailAvailabilityResult =
  | { ok: true; email: string; emailCanonical: string }
  | {
      ok: false;
      code:
        | "auth_email_invalid"
        | "auth_email_taken"
        | "auth_email_typo_duplicate"
        | "auth_email_blocked";
      suggestedEmail?: string;
      existingHint?: string;
    };

function splitLocalDomain(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/**
 * Ensure email is available for signup or email change (canonical + typo-aware).
 */
export async function assertEmailAvailable(args: {
  rawEmail: string;
  excludeUserId?: string;
}): Promise<EmailAvailabilityResult> {
  const email = normalizeAuthEmail(args.rawEmail);
  if (!email.includes("@") || isRetiredOrSystemEmail(email)) {
    return { ok: false, code: "auth_email_blocked" };
  }

  const typo = fixKnownEmailDomainTypo(email);
  const emailCanonical = canonicalEmailForDedup(typo.email);
  const db = getDb();

  const exclude = args.excludeUserId
    ? ne(users.id, args.excludeUserId)
    : sql`true`;

  const [canonicalHit] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.emailCanonical, emailCanonical), exclude))
    .limit(1);

  if (canonicalHit) {
    const suggested = suggestEmailTypoFix(email);
    if (suggested && suggested !== email) {
      return {
        ok: false,
        code: "auth_email_typo_duplicate",
        suggestedEmail: suggested,
        existingHint: canonicalHit.email,
      };
    }
    return { ok: false, code: "auth_email_taken" };
  }

  const [exactHit] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(
      and(
        or(eq(users.email, email), sql`lower(${users.email}) = ${email}`),
        exclude,
      ),
    )
    .limit(1);

  if (exactHit) {
    return { ok: false, code: "auth_email_taken" };
  }

  const parts = splitLocalDomain(typo.email);
  if (parts) {
    const fuzzy = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          sql`split_part(lower(${users.email}), '@', 1) = ${parts.local}`,
          exclude,
        ),
      )
      .limit(20);

    for (const row of fuzzy) {
      const other = splitLocalDomain(normalizeAuthEmail(row.email));
      if (!other) continue;
      if (other.domain === parts.domain) continue;
      if (domainsAreSuspiciouslySimilar(parts.domain, other.domain)) {
        const suggested = suggestEmailTypoFix(email) ?? `${parts.local}@${other.domain}`;
        return {
          ok: false,
          code: "auth_email_typo_duplicate",
          suggestedEmail: suggested,
          existingHint: row.email,
        };
      }
    }
  }

  return { ok: true, email: typo.email, emailCanonical };
}

/** Columns required for login / forgot-password - avoids 500 when local DB lags behind schema. */
const authUserSelect = {
  id: users.id,
  email: users.email,
  emailCanonical: users.emailCanonical,
  passwordHash: users.passwordHash,
  role: users.role,
  sessionVersion: users.sessionVersion,
};

export type AuthUserRow = {
  id: string;
  email: string;
  emailCanonical: string | null;
  passwordHash: string;
  role: string;
  sessionVersion: number;
};

/** Resolve user for login / forgot-password - exact email first, then canonical alias. */
export async function findUserByAuthEmail(email: string): Promise<AuthUserRow | null> {
  const normalized = normalizeAuthEmail(email);
  const db = getDb();

  const [byExact] = await db
    .select(authUserSelect)
    .from(users)
    .where(sql`lower(${users.email}) = ${normalized}`)
    .limit(1);
  if (byExact) return byExact;

  const canonical = canonicalEmailForDedup(normalized);
  const [byCanonical] = await db
    .select(authUserSelect)
    .from(users)
    .where(eq(users.emailCanonical, canonical))
    .limit(1);
  return byCanonical ?? null;
}
