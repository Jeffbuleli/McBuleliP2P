/** Detect Postgres "column does not exist" for KYC identity correction migration. */
export function isMissingKycIdentityCorrectionColumnsError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /kyc_identity_(correction|proposed|corrected)/i.test(msg);
}
