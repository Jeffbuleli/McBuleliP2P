import { buildMcBuleliInlineAttachments } from "@/lib/email/email-inline-images";
import { sendEmail } from "@/lib/email/send";
import {
  getPartnershipTemplate,
  type PartnershipTemplateId,
} from "@/lib/email/partnership/avadapay-templates";
import {
  PARTNERSHIP_EMAIL_ILLUSTRATION,
  partnershipEmailBaseUrl,
} from "@/lib/email/partnership/partnership-email-config";
import { renderPartnershipEmail } from "@/lib/email/partnership/render-partnership-email";

export async function sendPartnershipEmail(args: {
  to: string;
  templateId: PartnershipTemplateId;
}): Promise<boolean> {
  const template = getPartnershipTemplate(args.templateId);
  const illustration = PARTNERSHIP_EMAIL_ILLUSTRATION;
  const { html, text, subject } = renderPartnershipEmail({
    template,
    actionUrl: partnershipEmailBaseUrl(),
    illustration,
    useInlineImages: true,
  });

  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    inlineAttachments: buildMcBuleliInlineAttachments(illustration),
  });
}

export { renderPartnershipEmail, getPartnershipTemplate };
