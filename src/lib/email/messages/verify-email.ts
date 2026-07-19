import { createAuthChallenge } from "@/lib/auth/challenges";
import type { EmailLocale } from "@/lib/email/locale";
import { emailVerifyLink } from "@/lib/email/send";
import { sendMcBuleliTransactionalEmail } from "@/lib/email/send-transactional";

export async function sendEmailVerification(args: {
  userId: string;
  email: string;
  locale?: EmailLocale;
  /** Stored on the auth challenge (e.g. hackathonRegistrationId). */
  meta?: Record<string, unknown>;
}) {
  const locale = args.locale ?? "fr";
  const { rawCode } = await createAuthChallenge({
    userId: args.userId,
    purpose: "email_verify",
    meta: args.meta,
  });
  await sendMcBuleliTransactionalEmail({
    to: args.email,
    kind: "verify",
    locale,
    actionUrl: emailVerifyLink(rawCode),
  });
}
