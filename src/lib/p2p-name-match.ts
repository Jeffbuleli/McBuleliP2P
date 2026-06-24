/** Loose name token match for P2P payer verification hints. */

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(s: string): string[] {
  const n = normalizeName(s);
  if (!n) return [];
  return n.split(" ").filter((t) => t.length >= 2);
}

export function p2pLegalDisplayName(args: {
  legalFirstName?: string | null;
  legalLastName?: string | null;
  displayName?: string | null;
  kycStatus?: string | null;
}): string | null {
  const approved = (args.kycStatus ?? "none") === "approved";
  if (approved) {
    const parts = [args.legalFirstName, args.legalLastName]
      .map((p) => p?.trim())
      .filter(Boolean);
    if (parts.length > 0) return parts.join(" ");
  }
  const dn = args.displayName?.trim();
  return dn || null;
}

/** True when reference text likely does NOT match counterparty verified name. */
export function p2pPaymentNameMismatch(
  paymentReference: string,
  counterpartyVerifiedName: string | null,
): boolean {
  const ref = paymentReference.trim();
  const name = counterpartyVerifiedName?.trim();
  if (!ref || !name || ref.length < 3) return false;

  const refTokens = nameTokens(ref);
  const nameTokensList = nameTokens(name);
  if (nameTokensList.length === 0) return false;

  const matched = nameTokensList.some((nt) =>
    refTokens.some((rt) => rt.includes(nt) || nt.includes(rt)),
  );
  return !matched;
}
