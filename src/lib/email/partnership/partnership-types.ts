import type { EmailDetailRow } from "@/lib/email/wallet-email-details";

export type PartnershipTemplate = {
  id: string;
  locale: "fr" | "en";
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  cta: string;
  detailRows: EmailDetailRow[];
  /** When set, overrides default hi@ sender (e.g. ceo@ for Silikin). */
  fromAddress?: "hi" | "ceo";
};
