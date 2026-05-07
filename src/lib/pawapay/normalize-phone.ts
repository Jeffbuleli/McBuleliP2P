/**
 * PawaPay expects E.164-like numbers but some corridors reject the leading '+'.
 * For COD (RDC), normalize to `243XXXXXXXXX` (no '+') when users type local
 * numbers like `99xxxxxxx` / `81xxxxxxx`.
 */
export function normalizeCodPhoneNumber(input: string): string {
  let s = (input ?? "").trim();
  if (!s) return s;

  // Remove common separators.
  s = s.replace(/[()\s.-]/g, "");

  // Remove leading '+' (PawaPay in COD corridor may reject '+').
  if (s.startsWith("+")) s = s.slice(1);

  // Remove leading zeros (e.g. 099xxxxxxx -> 99xxxxxxx).
  while (s.startsWith("0")) s = s.slice(1);

  // If already has country code, keep it (just without '+').
  if (s.startsWith("243")) return s;

  // If user typed local 9-digit number (e.g. 99xxxxxxx, 81xxxxxxx), prefix COD.
  if (/^[89]\d{8}$/.test(s)) return `243${s}`;

  return s;
}

