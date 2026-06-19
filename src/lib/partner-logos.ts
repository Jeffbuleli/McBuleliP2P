/** Partner / channel logos under `/assets/partners/` (or crypto for Pi). */
export const PARTNER_LOGO: Record<string, string> = {
  airtel: "/assets/partners/airtel.png",
  orange: "/assets/partners/orange.png",
  mpesa: "/assets/partners/mpesa.png",
  africell: "/assets/partners/afrimoney.svg",
  afrimoney: "/assets/partners/afrimoney.svg",
  card: "/assets/partners/visa.svg",
  visa: "/assets/partners/visa.svg",
  mastercard: "/assets/partners/mastercard.svg",
  moko: "/assets/partners/moko.png",
  binance: "/assets/partners/binance.svg",
  okx: "/assets/partners/okx.svg",
  pi: "/assets/crypto/pi.png",
  "pi-network": "/assets/crypto/pi.png",
};

export const LANDING_PARTNERS: {
  id: string;
  logo: string;
  labelKey: string;
}[] = [
  { id: "moko", logo: PARTNER_LOGO.moko!, labelKey: "landing_partner_moko" },
  { id: "binance", logo: PARTNER_LOGO.binance!, labelKey: "landing_partner_binance" },
  { id: "okx", logo: PARTNER_LOGO.okx!, labelKey: "landing_partner_okx" },
  { id: "pi", logo: PARTNER_LOGO.pi!, labelKey: "landing_partner_pi" },
  { id: "visa", logo: PARTNER_LOGO.visa!, labelKey: "landing_partner_visa" },
  { id: "mastercard", logo: PARTNER_LOGO.mastercard!, labelKey: "landing_partner_mastercard" },
  { id: "airtel", logo: PARTNER_LOGO.airtel!, labelKey: "landing_partner_airtel" },
  { id: "mpesa", logo: PARTNER_LOGO.mpesa!, labelKey: "landing_partner_mpesa" },
  { id: "orange", logo: PARTNER_LOGO.orange!, labelKey: "landing_partner_orange" },
  { id: "afrimoney", logo: PARTNER_LOGO.afrimoney!, labelKey: "landing_partner_afrimoney" },
];

export function channelLogoPath(channel: string): string | null {
  return PARTNER_LOGO[channel] ?? null;
}
