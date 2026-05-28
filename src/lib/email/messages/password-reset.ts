import { createAuthChallenge } from "@/lib/auth/challenges";
import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { passwordResetLink, sendEmail } from "@/lib/email/send";

export async function sendPasswordResetEmail(args: {
  userId: string;
  email: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  const { rawCode } = await createAuthChallenge({
    userId: args.userId,
    purpose: "password_reset",
  });
  const link = passwordResetLink(rawCode);
  const copy = getEmailCopy("passwordReset", locale);
  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: link,
    illustration: "reset",
    locale,
  });
  await sendEmail({
    to: args.email,
    subject: emailSubject("passwordReset", locale),
    html,
    text,
  });
}
