import { sendEmailVerification as sendVerify } from "@/lib/email/messages/verify-email";
import type { EmailLocale } from "@/lib/email/locale";

export async function sendEmailVerification(
  userId: string,
  email: string,
  locale?: EmailLocale,
) {
  await sendVerify({ userId, email, locale });
}
