import { partnershipPublicBaseUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL } from "@/lib/support-contact";
import { PARTNERSHIP_PLACEHOLDERS } from "@/lib/email/partnership/avadapay-templates";

/** @deprecated use partnershipPublicBaseUrl */
export function partnershipEmailBaseUrl(): string {
  return partnershipPublicBaseUrl();
}

/** Conversation = Gmail Primary; marketing = card + CTA (Promotions). */
export type PartnershipEmailLayout = "conversation" | "marketing";

export const PARTNERSHIP_EMAIL_LAYOUT: PartnershipEmailLayout =
  "conversation";

/** Visible sender — hi@ (not noreply). */
export function partnershipEmailFrom(): string {
  const override = process.env.PARTNERSHIP_EMAIL_FROM?.trim();
  if (override) return override;
  const { contactName } = PARTNERSHIP_PLACEHOLDERS;
  return `${contactName} — McBuleli <${SUPPORT_EMAIL}>`;
}

/** Replies to CEO; ceo@ appears in signature. */
export function partnershipEmailReplyTo(): string {
  const override = process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim();
  if (override) return override;
  return PARTNERSHIP_PLACEHOLDERS.contactEmail;
}

/**
 * Always archive partnership outreach to hi@ (BCC),
 * unless that address is already the primary To.
 */
export function partnershipArchiveBcc(to: string): string | undefined {
  if (to.trim().toLowerCase() === SUPPORT_EMAIL.toLowerCase()) return undefined;
  return SUPPORT_EMAIL;
}
