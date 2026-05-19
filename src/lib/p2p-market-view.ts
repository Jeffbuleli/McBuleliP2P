import type { P2pSide } from "@/lib/p2p-config";

/** Taker view on marketplace: buy crypto vs sell crypto. */
export type P2pMarketView = "buy" | "sell";

/** Maker ad side shown in each marketplace tab. */
export function makerSideForMarketView(view: P2pMarketView): P2pSide {
  return view === "buy" ? "sell" : "buy";
}

export function marketViewFromMakerSide(side: P2pSide): P2pMarketView {
  return side === "sell" ? "buy" : "sell";
}

export type P2pPaymentKindFilter = "all" | "mobile" | "bank";

const MOBILE_HINTS = [
  "AIRTEL",
  "ORANGE",
  "MPESA",
  "M_PESA",
  "VODACOM",
  "MTN",
  "MOOV",
  "TIGO",
  "MOMO",
  "MOBILE",
  "WAVE",
  "ECOCASH",
];

const BANK_HINTS = ["BANK", "SEPA", "SWIFT", "WIRE", "IBAN", "TRANSFER", "VIREMENT"];

export function paymentMethodKindFromCode(code: string): "mobile" | "bank" | "other" {
  const c = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (BANK_HINTS.some((h) => c.includes(h))) return "bank";
  if (MOBILE_HINTS.some((h) => c.includes(h))) return "mobile";
  return "other";
}

export function adMatchesPaymentKind(
  codes: string[] | null | undefined,
  paymentMethodsText: string,
  kind: P2pPaymentKindFilter,
): boolean {
  if (kind === "all") return true;
  const list = codes?.length
    ? codes
    : paymentMethodsText
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);
  if (!list.length) return false;
  return list.some((raw) => {
    const k = paymentMethodKindFromCode(raw);
    return kind === "mobile" ? k === "mobile" : k === "bank";
  });
}
