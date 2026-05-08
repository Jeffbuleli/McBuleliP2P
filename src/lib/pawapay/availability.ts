export function isPawapaySupportedForCountry(countryCode: string | null | undefined): boolean {
  const c = (countryCode ?? "").trim().toUpperCase();
  // App stores ISO alpha-2. Some legacy data may use COD.
  return c === "CD" || c === "COD";
}

export function isPawapaySupportedCurrency(currency: string | null | undefined): boolean {
  const cur = (currency ?? "").trim().toUpperCase();
  return cur === "USD" || cur === "CDF";
}

export function pawapayCountryForApi(countryCode: string | null | undefined): "COD" {
  void countryCode;
  // PawaPay expects ISO3 for DR Congo = COD.
  return "COD";
}

