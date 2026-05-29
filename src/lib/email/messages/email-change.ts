import { createAuthChallenge } from "@/lib/auth/challenges";
import type { EmailLocale } from "@/lib/email/locale";
import { accountSecurityLink, emailChangeLink } from "@/lib/email/send";
import { sendMcBuleliTransactionalEmail } from "@/lib/email/send-transactional";

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
  await sendMcBuleliTransactionalEmail({
    to: args.newEmail,
    kind: "emailChange",
    locale,
    actionUrl: emailChangeLink(rawCode),
  });
}

export async function sendEmailChangeAlert(args: {
  currentEmail: string;
  newEmail: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  await sendMcBuleliTransactionalEmail({
    to: args.currentEmail,
    kind: "emailChangeAlert",
    locale,
    actionUrl: accountSecurityLink(),
    newEmail: args.newEmail,
  });
}
