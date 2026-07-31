/**
 * Exclude venue partners / already-partnered orgs from outbound lead campaigns.
 */

import { eq } from "drizzle-orm";
import {
  getDb,
  hackathonPartnerOrgs,
  hackathonPartners,
  hackathonSponsors,
} from "@/db";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";

/** Domains that must never receive lead-gen outreach (venue / TEXAF / known partners). */
export const OUTREACH_EXCLUDED_DOMAINS = [
  "texaf-rdc.com",
  "texaf.be",
  "silikinvillage.com",
] as const;

/** Company / org name patterns (case-insensitive). */
export const OUTREACH_EXCLUDED_COMPANY_RE = [
  /\bsilikin\b/i,
  /\btexaf\b/i,
] as const;

const GENERIC_LOCAL = new Set([
  "info",
  "infos",
  "contact",
  "support",
  "hello",
  "admin",
  "commercial",
  "office",
  "equipe",
  "équipe",
  "team",
  "sales",
]);

const FREEMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.fr",
  "yahoo.com",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "icloud.com",
  "live.com",
]);

const WEAK_COMPANY_NAMES = new Set([
  "n a",
  "na",
  "none",
  "null",
  "freelance",
  "independant",
  "indépendant",
  "particulier",
  "self",
  "moi",
]);

/**
 * One outreach key per company for this campaign launch.
 * Prefer normalized company name; else corporate email domain.
 * Freemail without usable company → null (person-level only).
 */
export function companyOutreachKey(
  company: string | null | undefined,
  email: string,
): string | null {
  const c = (company ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(sarl|sa|sas|sprl|asbl|ltd|llc|inc|co|congo|rdc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (c.length >= 2 && !WEAK_COMPANY_NAMES.has(c)) {
    return `co:${c}`;
  }
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || FREEMAIL_DOMAINS.has(domain)) return null;
  return `dom:${domain}`;
}

export function isCompanyStyleLead(args: {
  email: string;
  firstName?: string | null;
}): boolean {
  const fn = (args.firstName ?? "").trim().toLowerCase();
  if (
    fn === "équipe" ||
    fn === "equipe" ||
    fn === "contact" ||
    fn === "team" ||
    fn === "bonjour"
  ) {
    return true;
  }
  const at = args.email.lastIndexOf("@");
  if (at <= 0) return false;
  const local = args.email.slice(0, at).toLowerCase();
  const base = local.split("+")[0] ?? local;
  if (GENERIC_LOCAL.has(base)) return true;
  if (base.startsWith("office.") || base.startsWith("info.")) return true;
  return false;
}

export function isExcludedOutreachDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at <= 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return OUTREACH_EXCLUDED_DOMAINS.some(
    (d) => domain === d || domain.endsWith(`.${d}`),
  );
}

export function isExcludedOutreachCompany(company: string | null | undefined): boolean {
  const c = (company ?? "").trim();
  if (!c) return false;
  return OUTREACH_EXCLUDED_COMPANY_RE.some((re) => re.test(c));
}

export async function loadOutreachExclusionSet(editionId: string): Promise<{
  emailCanonicals: Set<string>;
  reasonByCanonical: Map<string, string>;
}> {
  const db = getDb();
  const emailCanonicals = new Set<string>();
  const reasonByCanonical = new Map<string, string>();

  const mark = (raw: string, reason: string) => {
    const c = canonicalEmailForDedup(raw);
    if (!c || !c.includes("@")) return;
    emailCanonicals.add(c);
    if (!reasonByCanonical.has(c)) reasonByCanonical.set(c, reason);
    if (isExcludedOutreachDomain(raw)) {
      emailCanonicals.add(c);
    }
  };

  const [partners, sponsors, orgs] = await Promise.all([
    db
      .select({ email: hackathonPartners.email, orgName: hackathonPartners.orgName })
      .from(hackathonPartners)
      .where(eq(hackathonPartners.editionId, editionId)),
    db
      .select({
        email: hackathonSponsors.email,
        companyName: hackathonSponsors.companyName,
      })
      .from(hackathonSponsors)
      .where(eq(hackathonSponsors.editionId, editionId)),
    db
      .select({
        contactEmail: hackathonPartnerOrgs.contactEmail,
        orgName: hackathonPartnerOrgs.orgName,
      })
      .from(hackathonPartnerOrgs)
      .where(eq(hackathonPartnerOrgs.editionId, editionId)),
  ]);

  for (const p of partners) {
    mark(p.email, `partner:${p.orgName}`);
  }
  for (const s of sponsors) {
    mark(s.email, `sponsor:${s.companyName}`);
  }
  for (const o of orgs) {
    if (o.contactEmail) mark(o.contactEmail, `partner_org:${o.orgName}`);
  }

  return { emailCanonicals, reasonByCanonical };
}

export function outreachSkipReason(args: {
  email: string;
  emailCanonical: string;
  company?: string | null;
  exclusion: { emailCanonicals: Set<string>; reasonByCanonical: Map<string, string> };
}): string | null {
  if (isExcludedOutreachDomain(args.email)) {
    return "existing_partner_venue";
  }
  if (isExcludedOutreachCompany(args.company)) {
    return "existing_partner_org";
  }
  if (args.exclusion.emailCanonicals.has(args.emailCanonical)) {
    return (
      args.exclusion.reasonByCanonical.get(args.emailCanonical) ??
      "existing_partner"
    );
  }
  return null;
}
