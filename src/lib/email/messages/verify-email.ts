import { createAuthChallenge } from "@/lib/auth/challenges";
import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { emailVerifyLink, sendEmail } from "@/lib/email/send";

export async function sendEmailVerification(args: {
  userId: string;
  email: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  const { rawCode } = await createAuthChallenge({
    userId: args.userId,
    purpose: "email_verify",
  });
  const link = emailVerifyLink(rawCode);
  const copy = getEmailCopy("verify", locale);
  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: link,
    illustration: "verify",
    locale,
  });
  await sendEmail({
    to: args.email,
    subject: emailSubject("verify", locale),
    html,
    text,
  });
}
