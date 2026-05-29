import { sendEmail } from "@/lib/email/send";

/** Sends branded HTML (inline SVG images — no attachments required). */
export async function sendBrandedEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  return sendEmail({
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
  });
}
