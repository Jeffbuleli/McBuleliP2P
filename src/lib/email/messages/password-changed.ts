import type { EmailLocale } from "@/lib/email/locale";
import { accountSecurityLink } from "@/lib/email/send";
import { sendMcBuleliTransactionalEmail } from "@/lib/email/send-transactional";

export async function sendPasswordChangedEmail(args: {
  email: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  await sendMcBuleliTransactionalEmail({
    to: args.email,
    kind: "passwordChanged",
    locale,
    actionUrl: accountSecurityLink(),
  });
}
