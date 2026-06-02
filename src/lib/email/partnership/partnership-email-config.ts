import {
  emailAssetBaseUrl,
  type EmailIllustration,
} from "@/lib/email/config";

const LOCAL_APP_URL =
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** CTA links in partnership emails — never localhost when sending from dev. */
export function partnershipEmailBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (raw && !LOCAL_APP_URL.test(raw)) return raw;
  return emailAssetBaseUrl();
}

/** Mobile-money / payout context (not security padlock). */
export const PARTNERSHIP_EMAIL_ILLUSTRATION: EmailIllustration =
  "withdrawUsdt";
