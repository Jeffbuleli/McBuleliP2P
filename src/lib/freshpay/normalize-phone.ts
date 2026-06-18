/**
 * DRC mobile numbers for FreshPay — normalize to `243XXXXXXXXX` (no '+').
 */
export function normalizeCodPhoneNumber(input: string): string {
  let s = (input ?? "").trim();
  if (!s) return s;

  s = s.replace(/[()\s.-]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  while (s.startsWith("0")) s = s.slice(1);
  if (s.startsWith("243")) return s;
  if (/^[89]\d{8}$/.test(s)) return `243${s}`;
  return s;
}

/** FreshPay examples use local `0XXXXXXXXX` in requests. */
export function formatFreshpayCustomerNumber(normalized243: string): string {
  const s = normalized243.trim();
  if (s.startsWith("243") && s.length >= 12) {
    return `0${s.slice(3)}`;
  }
  return s;
}
