import type { EmailIllustration } from "@/lib/email/config";
import { buildMcBuleliInlineAttachments } from "@/lib/email/email-inline-images";
import { sendEmail } from "@/lib/email/send";

/** Sends branded HTML with optional CID inline PNG attachments. */
export async function sendBrandedEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  illustration?: EmailIllustration;
}): Promise<boolean> {
  const inlineAttachments = args.illustration
    ? buildMcBuleliInlineAttachments(args.illustration)
    : undefined;

  return sendEmail({
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    inlineAttachments,
  });
}
