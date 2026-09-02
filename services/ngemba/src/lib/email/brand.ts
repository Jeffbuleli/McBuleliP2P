/** Tokens email alignes sur McBuleli + palette NGEMBA + logo officiel. */

export const NGEMBA_EMAIL_BRAND = {
  primary: "#06402b",
  primaryDark: "#042818",
  teal: "#00404c",
  green: "#419e3a",
  secondary: "#882364",
  urgent: "#c41e3a",
  mint: "#e6f2ec",
  text: "#0c1a14",
  muted: "#5c6b63",
  border: "rgba(6, 64, 43, 0.14)",
  white: "#ffffff",
} as const;

function assetBase(): string {
  return (
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://ngemba.cyberalert-rdc.org"
  );
}

export function ngembaLogoUrl(): string {
  return `${assetBase()}/brand/ngemba-logo.png`;
}

export const NGEMBA_EMAIL_ASSETS = {
  logo: ngembaLogoUrl(),
  mcbuleliLogo: "https://mcbuleli.org/brand/logo-256.png",
  illustration: "https://mcbuleli.org/email/email-security.png",
  site: "https://ngemba.cyberalert-rdc.org",
  supportEmail: "hi@mcbuleli.org",
} as const;

export const NGEMBA_EMAIL_FROM =
  "McBuleli NGEMBA <noreply@mcbuleli.org>";

export const NGEMBA_OPS_BCC_DEFAULT = "ceo@mcbuleli.org";
