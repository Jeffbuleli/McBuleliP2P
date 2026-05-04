export const APP_COUNTRY_CODES = [
  "CD",
  "CG",
  "RW",
  "BI",
  "UG",
  "KE",
  "TZ",
  "CM",
  "NG",
  "GH",
  "ZA",
  "SN",
  "CI",
  "FR",
  "BE",
  "US",
  "OTHER",
] as const;

export type AppCountryCode = (typeof APP_COUNTRY_CODES)[number];

export function isAppCountryCode(s: string): s is AppCountryCode {
  return (APP_COUNTRY_CODES as readonly string[]).includes(s);
}

