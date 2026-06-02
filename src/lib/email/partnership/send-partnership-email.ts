import { sendBrandedEmail } from "@/lib/email/send-branded";
import {
  getPartnershipTemplate,
  type PartnershipTemplateId,
} from "@/lib/email/partnership/avadapay-templates";
import { renderPartnershipEmail } from "@/lib/email/partnership/render-partnership-email";

export async function sendPartnershipEmail(args: {
  to: string;
  templateId: PartnershipTemplateId;
}): Promise<boolean> {
  const template = getPartnershipTemplate(args.templateId);
  const { html, text, subject } = renderPartnershipEmail({ template });

  return sendBrandedEmail({
    to: args.to,
    subject,
    html,
    text,
    illustration: "security",
  });
}

export { renderPartnershipEmail, getPartnershipTemplate };
