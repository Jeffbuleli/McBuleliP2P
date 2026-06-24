/** Extract MoMo / mobile money phone from a payment snapshot detail line. */
export function extractMomoPhoneFromPaymentDetail(detail: string): string | null {
  const cleaned = detail.replace(/[^\d+]/g, " ");
  const candidates = cleaned.match(/\+?\d{9,14}/g);
  if (!candidates?.length) return null;
  const best = candidates.sort((a, b) => b.replace(/\D/g, "").length - a.replace(/\D/g, "").length)[0];
  if (!best) return null;
  const digits = best.replace(/\D/g, "");
  if (digits.length < 9) return null;
  return best.startsWith("+") ? `+${digits}` : digits;
}

/** QR payload — scannable payment summary for MoMo / bank off-platform. */
export function buildP2pMomoQrPayload(args: {
  phone: string;
  amount: string;
  currency: string;
  orderId: string;
  payeeName?: string | null;
}): string {
  return JSON.stringify({
    v: 1,
    app: "mcbuleli_p2p",
    phone: args.phone.replace(/\s/g, ""),
    amount: args.amount,
    currency: args.currency,
    ref: args.orderId.slice(0, 8).toUpperCase(),
    name: args.payeeName?.trim() || undefined,
  });
}
