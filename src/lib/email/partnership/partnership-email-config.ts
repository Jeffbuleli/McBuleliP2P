import { partnershipPublicBaseUrl } from "@/lib/email/config";
import { SUPPORT_EMAIL } from "@/lib/support-contact";
import { PARTNERSHIP_PLACEHOLDERS } from "@/lib/email/partnership/partnership-placeholders";
import type { PartnershipTemplate } from "@/lib/email/partnership/partnership-types";

/** @deprecated use partnershipPublicBaseUrl */
export function partnershipEmailBaseUrl(): string {
  return partnershipPublicBaseUrl();
}

/** Conversation = Gmail Primary; marketing = card + CTA (Promotions). */
export type PartnershipEmailLayout = "conversation" | "marketing";

export const PARTNERSHIP_EMAIL_LAYOUT: PartnershipEmailLayout =
  "conversation";

/** Visible sender - hi@ by default; ceo@ when template requests it. */
export function partnershipEmailFrom(template?: PartnershipTemplate): string {
  const override = process.env.PARTNERSHIP_EMAIL_FROM?.trim();
  if (override) return override;
  const { contactName, contactEmail } = PARTNERSHIP_PLACEHOLDERS;
  const useCeo = template?.fromAddress === "ceo";
  const email = useCeo ? contactEmail : SUPPORT_EMAIL;
  return `${contactName} - McBuleli <${email}>`;
}

/** Replies to CEO; ceo@ appears in signature. */
export function partnershipEmailReplyTo(): string {
  const override = process.env.PARTNERSHIP_EMAIL_REPLY_TO?.trim();
  if (override) return override;
  return PARTNERSHIP_PLACEHOLDERS.contactEmail;
}
