import type { EmailIllustration } from "@/lib/email/config";
import { buildMcBuleliInlineAttachments } from "@/lib/email/email-inline-images";
import { sendEmail } from "@/lib/email/send";

/** Send HTML with Resend CID inline images (Gmail / mobile safe). */
export async function sendBrandedEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  illustration: EmailIllustration;
}): Promise<boolean> {
  return sendEmail({
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    inlineAttachments: buildMcBuleliInlineAttachments(args.illustration),
  });
}
