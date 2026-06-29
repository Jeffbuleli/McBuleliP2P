import { sendEmail } from "@/lib/email/send";
import type { ResendFileAttachment } from "@/lib/email/send";
import {
  getPartnershipTemplate,
  type PartnershipTemplateId,
} from "@/lib/email/partnership/partnership-registry";
import {
  PARTNERSHIP_EMAIL_LAYOUT,
  partnershipEmailFrom,
  partnershipEmailReplyTo,
  partnershipEmailBaseUrl,
} from "@/lib/email/partnership/partnership-email-config";
import { renderPartnershipEmail } from "@/lib/email/partnership/render-partnership-email";

export async function sendPartnershipEmail(args: {
  to: string;
  templateId: PartnershipTemplateId;
  fileAttachments?: ResendFileAttachment[];
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
    from: partnershipEmailFrom(template),
    replyTo: partnershipEmailReplyTo(),
    fileAttachments: args.fileAttachments,
  });
}

export { renderPartnershipEmail, getPartnershipTemplate };
