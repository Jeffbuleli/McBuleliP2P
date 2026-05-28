export { sendEmailVerification } from "@/lib/email/messages/verify-email";
export { sendPasswordResetEmail } from "@/lib/email/messages/password-reset";
export {
  sendEmailChangeConfirm,
  sendEmailChangeAlert,
} from "@/lib/email/messages/email-change";
export { sendPasswordChangedEmail } from "@/lib/email/messages/password-changed";

export {
  sendEmail,
  sendAuthEmail,
  appBaseUrl,
  emailVerifyLink,
  passwordResetLink,
  emailChangeLink,
  accountSecurityLink,
} from "@/lib/email/send";

export { resolveEmailLocale, normalizeEmailLocale } from "@/lib/email/locale";
export type { EmailLocale } from "@/lib/email/locale";
