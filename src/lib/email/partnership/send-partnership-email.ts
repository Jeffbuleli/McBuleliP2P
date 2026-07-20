import { sendEmail } from "@/lib/email/send";
import {
  getPartnershipTemplate,
  type PartnershipTemplateId,
} from "@/lib/email/partnership/avadapay-templates";
import {
  PARTNERSHIP_EMAIL_LAYOUT,
  partnershipArchiveBcc,
  partnershipEmailFrom,
  partnershipEmailReplyTo,
  partnershipEmailBaseUrl,
} from "@/lib/email/partnership/partnership-email-config";
import { renderPartnershipEmail } from "@/lib/email/partnership/render-partnership-email";

export async function sendPartnershipEmail(args: {
  to: string;
  templateId: PartnershipTemplateId;
}): Promise<boolean> {
  const template = getPartnershipTemplate(args.templateId);
  const { html, text, subject } = renderPartnershipEmail({
    template,
    actionUrl: partnershipEmailBaseUrl(),
    layout: PARTNERSHIP_EMAIL_LAYOUT,
  });

  return sendEmail({
    to: args.to,
    subject,
    html,
    text,
    from: partnershipEmailFrom(),
    replyTo: partnershipEmailReplyTo(),
    bcc: partnershipArchiveBcc(args.to),
  });
}

export { renderPartnershipEmail, getPartnershipTemplate };
