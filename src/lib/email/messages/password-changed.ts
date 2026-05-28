import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { accountSecurityLink, sendEmail } from "@/lib/email/send";

export async function sendPasswordChangedEmail(args: {
  email: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  const copy = getEmailCopy("passwordChanged", locale);
  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: accountSecurityLink(),
    illustration: "security",
    locale,
  });
  await sendEmail({
    to: args.email,
    subject: emailSubject("passwordChanged", locale),
    html,
    text,
  });
}
