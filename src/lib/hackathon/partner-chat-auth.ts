import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb, hackathonPartnerOrgs, hackathonPromoCodes, users } from "@/db";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { cookies } from "next/headers";
import type { PartnerOrgStatus } from "@/lib/hackathon/partner-chat";

const PREF_COOKIE = "mcbuleli_partner_chat_org";

export type PartnerChatSession = {
  editionId: string;
  orgId: string | null;
  email: string;
  displayName: string;
  staff: boolean;
  userId: string;
};

function asStatus(raw: string): PartnerOrgStatus {
  if (
    raw === "confirmed" ||
    raw === "in_progress" ||
    raw === "undetermined" ||
    raw === "rejected"
  ) {
    return raw;
  }
  return "undetermined";
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "Membre";
  return local.replace(/[._-]+/g, " ").slice(0, 40).trim() || "Membre";
}

export async function getUserDisplayName(userId: string, email: string) {
  const db = getDb();
  const [row] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const dn = row?.displayName?.trim();
  if (dn && dn.length >= 2) return dn.slice(0, 40);
  return displayNameFromEmail(email);
}

/** Orgs whose contact email matches the logged-in user. */
export async function findPartnerOrgsForEmail(
  editionId: string,
  email: string,
) {
  const db = getDb();
  const normalized = email.trim().toLowerCase();
  const byContact = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        ne(hackathonPartnerOrgs.status, "rejected"),
        sql`lower(${hackathonPartnerOrgs.contactEmail}) = ${normalized}`,
      ),
    )
    .orderBy(asc(hackathonPartnerOrgs.sortOrder));

  if (byContact.length) return byContact;

  // Fallback: active partner promo email for this edition → match org by name.
  const [promo] = await db
    .select({
      orgName: hackathonPromoCodes.orgName,
      partnerEmail: hackathonPromoCodes.partnerEmail,
    })
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, editionId),
        eq(hackathonPromoCodes.active, true),
        sql`lower(${hackathonPromoCodes.partnerEmail}) = ${normalized}`,
        sql`coalesce(${hackathonPromoCodes.kind}, 'partner') = 'partner'`,
      ),
    )
    .limit(1);

  if (!promo) return [];

  const name = promo.orgName.trim().toLowerCase();
  const all = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        ne(hackathonPartnerOrgs.status, "rejected"),
      ),
    )
    .orderBy(asc(hackathonPartnerOrgs.sortOrder));

  return all.filter(
    (o) =>
      o.orgName.trim().toLowerCase() === name ||
      o.shortName.trim().toLowerCase() === name ||
      name.includes(o.shortName.trim().toLowerCase()),
  );
}

async function readPreferredOrgId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(PREF_COOKIE)?.value?.trim();
  return raw && raw.length > 10 ? raw : null;
}

export function partnerChatOrgPrefCookieName() {
  return PREF_COOKIE;
}

/** Resolve access from McBuleli session only (no email OTP). */
export async function resolvePartnerChatAccess(
  editionId: string,
): Promise<
  | { ok: true; session: PartnerChatSession; matchedOrgs: { id: string; shortName: string; orgName: string; status: PartnerOrgStatus; logoUrl: string | null }[] }
  | { ok: false; error: "login_required" | "forbidden" | "no_edition"; status: number }
> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "login_required", status: 401 };
  }

  const displayName = await getUserDisplayName(user.id, user.email);

  if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AGENT) {
    return {
      ok: true,
      session: {
        editionId,
        orgId: null,
        email: user.email.toLowerCase(),
        displayName: "McBuleli",
        staff: true,
        userId: user.id,
      },
      matchedOrgs: [],
    };
  }

  const matched = await findPartnerOrgsForEmail(editionId, user.email);
  if (!matched.length) {
    return { ok: false, error: "forbidden", status: 403 };
  }

  const preferred = await readPreferredOrgId();
  const chosen =
    (preferred && matched.find((o) => o.id === preferred)) || matched[0];

  return {
    ok: true,
    session: {
      editionId,
      orgId: chosen.id,
      email: user.email.toLowerCase(),
      displayName,
      staff: false,
      userId: user.id,
    },
    matchedOrgs: matched.map((o) => ({
      id: o.id,
      shortName: o.shortName,
      orgName: o.orgName,
      status: asStatus(o.status),
      logoUrl: o.logoUrl,
    })),
  };
}

export async function requirePartnerChatAuth(
  editionId: string,
): Promise<
  | { ok: true; session: PartnerChatSession }
  | { ok: false; error: string; status: number }
> {
  const access = await resolvePartnerChatAccess(editionId);
  if (!access.ok) {
    return { ok: false, error: access.error, status: access.status };
  }
  return { ok: true, session: access.session };
}
