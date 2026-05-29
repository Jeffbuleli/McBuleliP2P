import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";

export const EMAIL_DEFAULT_FROM = "McBuleli <noreply@mcbuleli.org>";

export const EMAIL_BRAND = {
  primary: "#305f33",
  primaryDark: "#244a27",
  mint: "#e8f3ee",
  text: "#0c0a09",
  muted: "#57534e",
  border: "#d6d3d1",
  white: "#ffffff",
} as const;

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "https://mcbuleli.org"
  );
}

/** Logo & illustrations in emails — use prod URL so inboxes always load assets. */
export function emailAssetBaseUrl(): string {
  const override = process.env.EMAIL_ASSET_BASE_URL?.trim().replace(/\/$/, "");
  if (override) return override;
  return appBaseUrl();
}

export function logoUrl(): string {
  return `${emailAssetBaseUrl()}/brand/logo.png`;
}

export type EmailIllustration =
  | "verify"
  | "reset"
  | "change"
  | "security"
  | "depositUsdt"
  | "depositPi"
  | "withdrawUsdt"
  | "withdrawPi";

export function illustrationUrl(kind: EmailIllustration): string {
  const files: Record<EmailIllustration, string> = {
    verify: "email-verify.png",
    reset: "email-reset.png",
    change: "email-change.png",
    security: "email-security.png",
    depositUsdt: "email-deposit-usdt.png",
    depositPi: "email-deposit-pi.png",
    withdrawUsdt: "email-withdraw-usdt.png",
    withdrawPi: "email-withdraw-pi.png",
  };
  return `${emailAssetBaseUrl()}/email/${files[kind]}`;
}

export function emailReplyTo(): string {
  return process.env.AUTH_EMAIL_REPLY_TO?.trim() || SUPPORT_EMAIL;
}

export function emailFromAddress(): string {
  return process.env.AUTH_EMAIL_FROM?.trim() || EMAIL_DEFAULT_FROM;
}

export const EMAIL_FOOTER = {
  supportEmail: SUPPORT_EMAIL,
  whatsApp: SUPPORT_WA_PATH,
  x: SUPPORT_X,
  site: appBaseUrl(),
} as const;
