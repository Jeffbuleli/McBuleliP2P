import { createAuthChallenge } from "@/lib/auth/challenges";
import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { emailChangeLink, accountSecurityLink, sendEmail } from "@/lib/email/send";

export async function sendEmailChangeConfirm(args: {
  userId: string;
  newEmail: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  const { rawCode } = await createAuthChallenge({
    userId: args.userId,
    purpose: "email_change",
    meta: { newEmail: args.newEmail },
  });
  const link = emailChangeLink(rawCode);
  const copy = getEmailCopy("emailChange", locale);
  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: link,
    illustration: "change",
    locale,
  });
  await sendEmail({
    to: args.newEmail,
    subject: emailSubject("emailChange", locale),
    html,
    text,
  });
}

export async function sendEmailChangeAlert(args: {
  currentEmail: string;
  newEmail: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  const copy = getEmailCopy("emailChangeAlert", locale);
  const body =
    locale === "fr"
      ? `${copy.body} Nouvelle adresse demandée : ${args.newEmail}.`
      : `${copy.body} Requested address: ${args.newEmail}.`;
  const { html, text } = renderMcBuleliEmail({
    copy: { ...copy, body },
    actionUrl: accountSecurityLink(),
    illustration: "security",
    locale,
  });
  await sendEmail({
    to: args.currentEmail,
    subject: emailSubject("emailChangeAlert", locale),
    html,
    text,
  });
}
