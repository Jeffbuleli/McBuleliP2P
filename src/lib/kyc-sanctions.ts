/** AML / sanctions rejection that must block KYC retry. */
export function isKycSanctionsRejection(note: string | null | undefined): boolean {
  if (!note?.trim()) return false;
  const n = note.toLowerCase();
  return (
    n.includes("sanction") ||
    n.includes("watchlist") ||
    n.includes("region under sanctions") ||
    n.includes("under sanctions") ||
    n.includes("blocked region") ||
    n.includes("sanctions list")
  );
}
