import { createAuthChallenge, invalidateActiveAuthChallenges } from "@/lib/auth/challenges";
import type { EmailLocale } from "@/lib/email/locale";
import { passwordResetLink } from "@/lib/email/send";
import { sendMcBuleliTransactionalEmail } from "@/lib/email/send-transactional";

export async function sendPasswordResetEmail(args: {
  userId: string;
  email: string;
  locale?: EmailLocale;
}) {
  const locale = args.locale ?? "fr";
  await invalidateActiveAuthChallenges({
    userId: args.userId,
    purpose: "password_reset",
  });
  const { rawCode } = await createAuthChallenge({
    userId: args.userId,
    purpose: "password_reset",
  });
  await sendMcBuleliTransactionalEmail({
    to: args.email,
    kind: "passwordReset",
    locale,
    actionUrl: passwordResetLink(rawCode),
  });
}
