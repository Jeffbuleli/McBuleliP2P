import {
  isPawapaySupportedCurrency,
  isPawapaySupportedForCountry,
} from "@/lib/pawapay/availability";

/** @deprecated Prefer isPawapaySupportedForCountry — same DRC gate for fiat MoMo/card. */
export function isFreshpaySupportedForCountry(countryCode: string | null | undefined): boolean {
  return isPawapaySupportedForCountry(countryCode);
}

/** @deprecated Prefer isPawapaySupportedCurrency */
export function isFreshpaySupportedCurrency(currency: string | null | undefined): boolean {
  return isPawapaySupportedCurrency(currency);
}
