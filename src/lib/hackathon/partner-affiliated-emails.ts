/**
 * Extra login emails for dual-contact partner orgs (chat + badge affiliation).
 * Primary contact stays on hackathon_partner_orgs.contact_email; aliases grant access too.
 */
export const PARTNER_AFFILIATED_EMAILS: Record<string, readonly string[]> = {
  /** IA Académie RDC + Computer's House of Kinshasa (CHK) */
  "ia-academie-chk": ["contact@ch-kin.com", "contact@ia-academie.cd"],
  /** RDPI Think Tank — survey dashboard + partner workspace */
  rdpi: ["maristote@rdpithinktank.org", "info@rdpithinktank.org"],
};

export function affiliatedEmailsForSlug(slug: string): string[] {
  return [...(PARTNER_AFFILIATED_EMAILS[slug] ?? [])].map((e) =>
    e.trim().toLowerCase(),
  );
}

export function emailMatchesOrgAffiliation(
  org: { slug: string; contactEmail: string },
  email: string,
): boolean {
  const normalized = email.trim().toLowerCase();
  if (org.contactEmail.trim().toLowerCase() === normalized) return true;
  return affiliatedEmailsForSlug(org.slug).includes(normalized);
}
