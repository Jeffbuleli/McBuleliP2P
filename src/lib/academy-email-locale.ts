/** Rough locale for cron emails when user has no stored locale (DRC-first default: fr). */
const ENGLISH_PREFERRED_COUNTRIES = new Set([
  "US",
  "GB",
  "IE",
  "AU",
  "NZ",
  "NG",
  "KE",
  "GH",
  "UG",
  "TZ",
  "ZW",
  "ZM",
  "MW",
  "BW",
  "PK",
  "IN",
  "PH",
]);

export function preferFrenchEmail(countryCode: string | null | undefined): boolean {
  if (!countryCode?.trim()) return true;
  return !ENGLISH_PREFERRED_COUNTRIES.has(countryCode.trim().toUpperCase());
}
