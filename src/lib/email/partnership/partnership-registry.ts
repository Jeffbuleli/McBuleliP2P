import {
  getAvadapayTemplate,
  listAvadapayTemplateIds,
  type AvadapayTemplateId,
} from "@/lib/email/partnership/avadapay-templates";
import {
  getSilikinTemplate,
  listSilikinTemplateIds,
  type SilikinTemplateId,
} from "@/lib/email/partnership/silikin-templates";
import type { PartnershipTemplate } from "@/lib/email/partnership/partnership-types";

export type PartnershipTemplateId = AvadapayTemplateId | SilikinTemplateId;

const ALL_IDS: PartnershipTemplateId[] = [
  ...listAvadapayTemplateIds(),
  ...listSilikinTemplateIds(),
];

export function getPartnershipTemplate(id: PartnershipTemplateId): PartnershipTemplate {
  if (id.startsWith("silikin_")) {
    return getSilikinTemplate(id as SilikinTemplateId);
  }
  return getAvadapayTemplate(id as AvadapayTemplateId);
}

export function listPartnershipTemplateIds(): PartnershipTemplateId[] {
  return [...ALL_IDS];
}

export { PARTNERSHIP_PLACEHOLDERS } from "@/lib/email/partnership/partnership-placeholders";
