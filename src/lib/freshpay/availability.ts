export function isFreshpaySupportedForCountry(countryCode: string | null | undefined): boolean {
  const c = (countryCode ?? "").trim().toUpperCase();
  return c === "CD" || c === "COD";
}

export function isFreshpaySupportedCurrency(currency: string | null | undefined): boolean {
  const cur = (currency ?? "").trim().toUpperCase();
  return cur === "USD" || cur === "CDF";
}
