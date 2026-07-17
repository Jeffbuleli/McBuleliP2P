/** PawaPay MoMo — DRC only, USD/CDF. */

export function isPawapaySupportedForCountry(countryCode: string | null | undefined): boolean {
  const c = (countryCode ?? "").trim().toUpperCase();
  return c === "CD" || c === "COD";
}

export function isPawapaySupportedCurrency(currency: string | null | undefined): boolean {
  const cur = (currency ?? "").trim().toUpperCase();
  return cur === "USD" || cur === "CDF";
}
