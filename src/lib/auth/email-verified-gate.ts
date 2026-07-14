/**
 * Email verification gate for password / passkey accounts.
 * Pi ephemeral emails (`@pi.local`) cannot receive mail — exempt.
 */
export function isPiLocalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@pi.local");
}

export function userNeedsEmailVerification(args: {
  email: string;
  emailVerifiedAt: Date | string | null | undefined;
}): boolean {
  if (isPiLocalEmail(args.email)) return false;
  return !args.emailVerifiedAt;
}

export const VERIFY_EMAIL_PENDING_PATH = "/verify-email/pending";
