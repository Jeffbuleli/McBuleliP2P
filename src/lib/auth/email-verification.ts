import { createAuthChallenge } from "@/lib/auth/challenges";
import {
  emailVerifyLink,
  sendAuthEmail,
} from "@/lib/auth/email";

export async function sendEmailVerification(userId: string, email: string) {
  const { rawCode } = await createAuthChallenge({
    userId,
    purpose: "email_verify",
  });
  const link = emailVerifyLink(rawCode);
  await sendAuthEmail({
    to: email,
    subject: "McBuleli — confirmez votre email",
    html: `<p>Bienvenue sur McBuleli.</p><p><a href="${link}">Confirmer mon email</a></p>`,
    text: `Confirmer : ${link}`,
  });
}
