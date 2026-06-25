import { PARTNER_LOGO } from "@/lib/partner-logos";

/** Partners shown in hero strip (rails + liquidity). */
export const LANDING_HERO_PARTNERS = [
  { id: "moko", logo: PARTNER_LOGO.moko!, label: "Moko Afrika" },
  { id: "orange", logo: PARTNER_LOGO.orange!, label: "Orange Money" },
  { id: "mpesa", logo: PARTNER_LOGO.mpesa!, label: "M-Pesa" },
  { id: "airtel", logo: PARTNER_LOGO.airtel!, label: "Airtel Money" },
  { id: "afrimoney", logo: PARTNER_LOGO.afrimoney!, label: "Afrimoney" },
  { id: "pi", logo: PARTNER_LOGO.pi!, label: "Pi Network" },
  { id: "binance", logo: PARTNER_LOGO.binance!, label: "Binance" },
  { id: "okx", logo: PARTNER_LOGO.okx!, label: "OKX" },
] as const;
